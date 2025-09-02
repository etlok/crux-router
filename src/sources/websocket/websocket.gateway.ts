import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';
import { Logger, UseGuards } from '@nestjs/common';
import { EventPayloadDto } from './dto/event-payload.dto';
import { v4 as uuidv4 } from 'uuid'; 
import { ClientAuthService } from './client-auth.service';

@WebSocketGateway({ cors: true })
export class WSGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private redisSubscribed = false;
  private maxRetries = 5;
  private readonly logger = new Logger(WSGateway.name);
private readonly rateLimiter = new Map<string, { count: number, resetTime: number }>();
private readonly RATE_LIMIT = 50; // messages per minute
private readonly RATE_WINDOW = 60000; // 1 minute in ms
private connectedClients = new Set<string>();
  private authenticatedClients = new Set<string>();

  constructor(private redisService: RedisService, private routerService: RouterService,
     private clientAuthService: ClientAuthService
  ) {}

  async afterInit() {
    this.logger.log('WebSocket Gateway initialized');
    await this.subscribeToWorkerResponses();
  }

  private async subscribeToWorkerResponses(retryCount = 0) {
    try {
      if (!this.redisSubscribed) {
        await this.redisService.subscribe('worker_responses', (message: string) => {
          this.logger.log(` ----- Worker response from Redis: ${message}`);
          const response = JSON.parse(message);
         
          
  // If response has specific room/client info, use it
    if (response.room) {
      this.server.to(response.room).emit('outgoing_event', response);
    } else if (response.clientId) {
      this.server.to(response.clientId).emit('outgoing_event', response);
    } else {
      // Otherwise broadcast to all
      this.server.emit('outgoing_event', response);
    }


        });
        this.redisSubscribed = true;
        this.logger.log('Subscribed to worker_responses');
      }
    } catch (err) {
      this.logger.error(`Redis subscribe error: ${err.message}`);
      if (retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        setTimeout(() => this.subscribeToWorkerResponses(retryCount + 1), delay);
      } else {
        this.logger.error('Max Redis subscribe retries reached');
      }
    }
  }

 handleConnection(client: Socket) {
    // Get client ID from handshake
    const clientId = client.handshake.auth.clientId || 
                    client.handshake.headers['x-client-id'];
    
    // Store provided client ID in socket data for future reference
    client.data.providedClientId = clientId;
    
    // Check if client ID is provided and valid
    if (!clientId) {
      this.logger.warn(`Client connected without ID: ${client.id}`);
      // You can choose to disconnect immediately or give a grace period
      setTimeout(() => {
        if (!this.authenticatedClients.has(client.id)) {
          client.disconnect(true);
          this.logger.warn(`Disconnected unauthenticated client: ${client.id}`);
        }
      }, 10000); // 10 seconds grace period
    } else {
      // For demo, add the ID as valid
      // In production, you'd validate against a pre-existing list, to be removed in prod
      this.clientAuthService.addValidClient(clientId);
      
      if (this.clientAuthService.isValidClient(clientId)) {
        this.authenticatedClients.add(client.id);
        this.logger.log(`Authenticated client connected: ${client.id}, clientId: ${clientId}`);
      } else {
        this.logger.warn(`Client with invalid ID rejected: ${client.id}, clientId: ${clientId}`);
        client.disconnect(true);
        return;
      }
    }
    
    this.connectedClients.add(client.id);
    this.logger.log(`Client connected: ${client.id}, total: ${this.connectedClients.size}`);
  }

 handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.authenticatedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}, remaining: ${this.connectedClients.size}`);
    
    // If this was the last client, consider unsubscribing from Redis
    if (this.connectedClients.size === 0 && this.redisSubscribed) {
      this.redisService.unsubscribe('worker_responses');
      this.redisSubscribed = false;
      this.logger.log('No connected clients, unsubscribed from Redis');
    }
  }


    // Add explicit authentication method clients can call
  @SubscribeMessage('authenticate')
  handleAuthenticate(@MessageBody() data: { clientId: string }, @ConnectedSocket() client: Socket) {
    if (!data || !data.clientId) {
      return { status: 'error', message: 'Client ID is required' };
    }
    
    // Store provided client ID
    client.data.providedClientId = data.clientId;
    
    // Validate client ID
    if (this.clientAuthService.isValidClient(data.clientId)) {
      this.authenticatedClients.add(client.id);
      this.logger.log(`Client authenticated: ${client.id}, clientId: ${data.clientId}`);
      return { status: 'success', message: 'Authentication successful' };
    } else {
      this.logger.warn(`Authentication failed for client: ${client.id}`);
      // Don't disconnect immediately to allow retry
      return { status: 'error', message: 'Invalid client ID' };
    }
  }


  @SubscribeMessage('incoming_event')
  async handleEvent(@MessageBody() data: EventPayloadDto,   @ConnectedSocket() client: Socket) {

     const clientId = client.id;
  

       // Check if client is authenticated
    if (!this.authenticatedClients.has(client.id)) {
      this.logger.warn(`Unauthenticated event from client: ${client.id}`);
      return { 
        status: 'error', 
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please authenticate first.',
        timestamp: new Date().toISOString()
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
    return { status: 'error', message: 'Rate limit exceeded. Try again later.' };
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
          clientId: client.data.providedClientId,
          socketId: client.id
        }
      };


     // Log with request ID for traceability
    const requestId = uuidv4();
    this.logger.log(`[${requestId}] Received WebSocket event: ${event}`);



      const result = await this.routerService.routeEvent(event, enhancedPayload);
      
      // Send detailed success response
    return {
      status: 'success',
      requestId,
      timestamp: new Date().toISOString(),
      data: result
    };


    } catch (err) {
      this.logger.error(`Failed to route event: ${err.message}`);

 return {
      status: 'error',
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    };

    }
  }

  broadcastEvent(event: any) {
    this.logger.log(`Broadcasting event: ${JSON.stringify(event)}`);
    this.server.emit('outgoing_event', event);
  }


  @SubscribeMessage('join_room')
handleJoinRoom(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
  client.join(data.room);
  return { status: 'ok', room: data.room };
}


  handleIncomingEvent(event:any){
    this.logger.log(`incoming event: ${JSON.stringify(event)}`);


    this.server.emit('incoming_event', event)

  }
}
