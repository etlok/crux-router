import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';
import { Logger, UseGuards, Inject, UseInterceptors } from '@nestjs/common';
import { EventPayloadDto } from './dto/event-payload.dto';
import { v4 as uuidv4 } from 'uuid';
import { ClientAuthService } from './client-auth.service';

import { DynamicWsMiddlewareInterceptor } from 'src/middleware/dynamic-ws-middleware.interceptor';
import { EventProcessorService } from 'src/events/event-processor.service';
import { WorkerLogEmitterService } from 'src/events/worker-log-emitter.service';

@WebSocketGateway({ cors: true })
@UseInterceptors(DynamicWsMiddlewareInterceptor)
export class WSGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private redisSubscribed = false;
  private maxRetries = 5;
  private readonly logger = new Logger(WSGateway.name);
  private readonly rateLimiter = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly RATE_LIMIT = 50; // messages per minute
  private readonly RATE_WINDOW = 60000; // 1 minute in ms
  private connectedClients = new Set<string>();
  private authenticatedClients = new Set<string>();

  constructor(
    private redisService: RedisService,
    private routerService: RouterService,
    private clientAuthService: ClientAuthService,
    private eventProcessorService: EventProcessorService,
    private workerLogEmitterService: WorkerLogEmitterService,
  ) {}

  async afterInit() {
    this.logger.log('WebSocket Gateway initialized');
    // Provide the server instance to the WorkerLogEmitterService
    this.workerLogEmitterService.setServer(this.server);
    await this.subscribeToWorkerResponses();
  }

  private async subscribeToWorkerResponses(retryCount = 0) {
    try {
      if (!this.redisSubscribed) {
        await this.redisService.subscribe(
          'worker_responses',
          (message: string) => {
            this.logger.log(` ----- Worker response from Redis: ${message}`);
            const response = JSON.parse(message);

            // If response has specific room/client info, use it
            if (response.room) {
              this.server.to(response.room).emit('outgoing_event', response);
            } else if (response.clientId) {
              this.server
                .to(response.clientId)
                .emit('outgoing_event', response);
            } else {
              // Otherwise broadcast to all
              this.server.emit('outgoing_event', response);
            }
          },
        );
        this.redisSubscribed = true;
        this.logger.log('Subscribed to worker_responses');
      }
    } catch (err) {
      this.logger.error(`Redis subscribe error: ${err.message}`);
      if (retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        setTimeout(
          () => this.subscribeToWorkerResponses(retryCount + 1),
          delay,
        );
      } else {
        this.logger.error('Max Redis subscribe retries reached');
      }
    }
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.add(client.id);

    // Use the auth middleware to authenticate the client
 //   const user = await this.wsAuthMiddleware.authenticate(client);

   
      // Give a grace period for authentication via explicit authenticate event
      this.logger.log(`Client not authenticated on connection: ${client.id}`);

      // Extend the grace period for authentication
      setTimeout(() => {
        if (client.connected && !this.authenticatedClients.has(client.id)) {
          this.logger.warn(
            `Client ${client.id} still not authenticated after grace period, but allowing connection`,
          );
          // We're not disconnecting - allowing time for the client to authenticate via the authenticate event
          // client.disconnect(true);
        }
      }, 60000); // 60 seconds grace period
    

    this.logger.log(
      `Client connected: ${client.id}, total: ${this.connectedClients.size}`,
    );
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.authenticatedClients.delete(client.id);
    this.logger.log(
      `Client disconnected: ${client.id}, remaining: ${this.connectedClients.size}`,
    );

    // If this was the last client, consider unsubscribing from Redis
    if (this.connectedClients.size === 0 && this.redisSubscribed) {
      this.redisService.unsubscribe('worker_responses');
      this.redisSubscribed = false;
      this.logger.log('No connected clients, unsubscribed from Redis');
    }
  }

  // Add explicit authentication method clients can call
  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !data.token) {
      return { status: 'error', message: 'JWT token is required' };
    }

    try {
      // Update the token in handshake auth for the middleware to use
      client.handshake.auth.token = data.token;

      // Use our authentication middleware
     // const user = await this.wsAuthMiddleware.authenticate(client);

      // if (!user) {
      //   return { status: 'error', message: client.data.authError || 'Authentication failed' };
      // }

      // Mark client as authenticated if not already
      if (!this.authenticatedClients.has(client.id)) {
        this.authenticatedClients.add(client.id);
      }

 ;

      return {
        status: 'success',
        message: 'Authentication successful',
       
      };
    } catch (err) {
      this.logger.warn(
        `Authentication failed for client: ${client.id} - ${err.message}`,
      );
      // Don't disconnect immediately to allow retry
      return {
        status: 'error',
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      };
    }
  }

  @SubscribeMessage('incoming_event')
  async handleEvent(
    @MessageBody() data: EventPayloadDto,
    @ConnectedSocket() client: Socket,
  ) {
    const clientId = client.id;

    // Check if client is authenticated
    if (!this.authenticatedClients.has(client.id)) {
      this.logger.warn(`Unauthenticated event from client: ${client.id}`);
      return {
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please authenticate first.',
        timestamp: new Date().toISOString(),
      };
    }

    // Check rate limit
    const now = Date.now();
    let limit = this.rateLimiter.get(clientId);

    if (!limit || now > limit.resetTime) {
      // New window
      limit = { count: 1, resetTime: now + this.RATE_WINDOW };
      this.rateLimiter.set(clientId, limit);
    } else if (limit.count >= this.RATE_LIMIT) {
      // Rate limit exceeded
      this.logger.warn(`Rate limit exceeded for client ${clientId}`);
      return {
        status: 'error',
        message: 'Rate limit exceeded. Try again later.',
      };
    } else {
      // Increment count
      limit.count++;
    }

    this.logger.log(`Received WebSocket event: ${JSON.stringify(data)}`);

    try {
      // Validate input
      if (!data || !data.event) {
        throw new WsException('Invalid event format: missing event name');
      }

      const { event, payload } = data;

      // Add client-specific data to payload for traceability
      const enhancedPayload = {
        ...payload,
        _meta: {
          userId: client.data.user?.sub || client.data.user?.id,
          socketId: client.id,
          // Include additional user info that might be useful for processing
          roles: client.data.user?.roles || [],
          token: client.data.token, // Be cautious about including the token in production
        },
      };

      // Log with request ID for traceability
      const requestId = uuidv4();
      this.logger.log(`[${requestId}] Received WebSocket event: ${event}`);

      const result = await this.routerService.routeEvent(
        event,
        enhancedPayload,
      );

      // Send detailed success response
      return {
        status: 'success',
        requestId,
        timestamp: new Date().toISOString(),
        data: result,
      };
    } catch (err) {
      this.logger.error(`Failed to route event: ${err.message}`);

      return {
        status: 'error',
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @SubscribeMessage('event_processor')
  async handleEventWithMiddleware(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const clientId = client.id;
    this.logger.log(`Received event_processor request from client ${clientId}`);

    // Check if client is authenticated
    // if (!this.authenticatedClients.has(clientId)) {
    //   this.logger.warn(`Unauthenticated event from client: ${clientId}`);
    //   return {
    //     status: 'error',
    //     code: 'UNAUTHORIZED',
    //     message: 'Authentication required. Please authenticate first.',
    //     timestamp: new Date().toISOString()
    //   };
    // }

    // Check rate limit
    const now = Date.now();
    let limit = this.rateLimiter.get(clientId);

    if (!limit || now > limit.resetTime) {
      limit = { count: 1, resetTime: now + this.RATE_WINDOW };
      this.rateLimiter.set(clientId, limit);
    } else if (limit.count >= this.RATE_LIMIT) {
      this.logger.warn(`Rate limit exceeded for client ${clientId}`);
      return {
        status: 'error',
        message: 'Rate limit exceeded. Try again later.',
      };
    } else {
      limit.count++;
    }

    try {
      // Validate input format
      if (!data || !data.event) {
        throw new WsException('Invalid event format: missing event name');
      }

      if (!Array.isArray(data.middleware)) {
        throw new WsException(
          'Invalid event format: middleware must be an array',
        );
      }

      if (!Array.isArray(data.actions)) {
        throw new WsException('Invalid event format: actions must be an array');
      }

      // payload source context with client information - without circular references
      const sourceContext = {
        socketId: client.id,
        userId: client.data?.user?.sub || client.data?.user?.id,
        userInfo: client.data?.user,
        isAuthenticated: this.authenticatedClients.has(client.id),
        // Include clientData but not the Socket object itself
        clientData: client.data,
      };

      // Process the event through middleware chain
      const result = await this.eventProcessorService.processEvent(
        data,
        sourceContext,
      );

      return {
        status: 'success',
        requestId: uuidv4(),
        timestamp: new Date().toISOString(),
        data: result,
      };
    } catch (err) {
      this.logger.error(`Failed to process event: ${err.message}`);
      return {
        status: 'error',
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Simple ping handler for testing connection
   */
  @SubscribeMessage('ping')
  async handlePing(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Received ping from client ${client.id}`);
    return {
      pong: true,
      timestamp: Date.now(),
      clientId: client.id,
      isAuthenticated: this.authenticatedClients.has(client.id),
      receivedData: data,
    };
  }

  /**
   * Get a test token for development use
   * This allows clients to get a properly signed token for testing
   */
  @SubscribeMessage('get_test_token')
  async getTestToken() {
    try {
      const tokenInfo = this.clientAuthService.getSampleTestTokenWithInfo();
      return {
        status: 'success',
        token: tokenInfo.token,
        expiresAt: new Date(tokenInfo.payload.exp * 1000).toISOString(),
        payload: tokenInfo.payload,
      };
    } catch (error) {
      this.logger.error(`Failed to generate test token: ${error.message}`);
      return {
        status: 'error',
        message: 'Failed to generate test token',
      };
    }
  }

  broadcastEvent(event: any) {
    this.logger.log(`Broadcasting event: ${JSON.stringify(event)}`);
    this.server.emit('outgoing_event', event);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.room);
    this.logger.log(`Client ${client.id} joined room: ${data.room}`);
    return { status: 'ok', room: data.room };
  }

  /**
   * Join one or more clients to specified channels
   * This can be used by the controller to subscribe clients to channels
   */
  joinClientsToChannels(channels: string[], clientIds?: string[]) {
    if (!channels || channels.length === 0) {
      return { status: 'error', message: 'No channels specified' };
    }

    if (clientIds && clientIds.length > 0) {
      // Join specific clients to channels
      clientIds.forEach((clientId) => {
        channels.forEach((channel) => {
          this.server.in(clientId).socketsJoin(channel);
        });
        this.logger.log(
          `Joined client ${clientId} to channels: ${channels.join(', ')}`,
        );
      });
    } else {
      // Join all clients to channels
      channels.forEach((channel) => {
        this.server.sockets.socketsJoin(channel);
      });
      this.logger.log(`Joined all clients to channels: ${channels.join(', ')}`);
    }

    return {
      status: 'success',
      message: clientIds
        ? `Joined ${clientIds.length} clients to ${channels.length} channels`
        : `Joined all clients to ${channels.length} channels`,
    };
  }

  handleIncomingEvent(event: any) {
    this.logger.log(`incoming event: ${JSON.stringify(event)}`);

    this.server.emit('incoming_event', event);
  }

  /**
   * Get the count of all connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get the count of authenticated clients
   */
  getAuthenticatedClientsCount(): number {
    return this.authenticatedClients.size;
  }
}
