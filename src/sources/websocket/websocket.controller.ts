import { Controller, Post, Body, Get, UnauthorizedException, BadRequestException, Query, Logger } from '@nestjs/common';
import { WSGateway } from './websocket.gateway';
import { ClientAuthService } from './client-auth.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';
import { v4 as uuidv4 } from 'uuid'; 

// Define DTOs
class LoginDto {
  username: string;
  password: string;
}

class BroadcastDto {
  event: string;
  data: any;
  room?: string;
  clientId?: string;
}

class InitializeDto {
  auth: Record<string, any>;
  event: string;
  payload: {
    channels: string[];
  };
}

class ChannelBroadcastDto {
  event: string;
  channel_ids: string[];
  payload: Record<string, any>;
}

class TokenValidationDto {
  token: string;
}

@Controller('websocket')
export class WebSocketController {
  private readonly logger = new Logger(WebSocketController.name);
  
  constructor(
    private readonly wsGateway: WSGateway, 
    private readonly clientAuthService: ClientAuthService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService
  ) {}

  /**
   * Simulates user authentication and generates a JWT token
   * In a real application, this would validate credentials against a database
   */
  @Post('token')
  async generateToken(@Body() loginDto: LoginDto) {
    try {
      // Validate login details (this is a simplified example)
      // In a real application, you would check against a database
      if (!loginDto.username || !loginDto.password) {
        throw new BadRequestException('Username and password are required');
      }

      // Simple validation - in production, you'd check against a database
      // For demo purposes only - REPLACE THIS with real authentication
      const isValidUser = await this.validateUserCredentials(loginDto.username, loginDto.password);
      
      if (!isValidUser) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Generate a user ID if it's a new user (in real apps, you'd use the user's actual ID)
      const userId = await this.getUserId(loginDto.username);
      
      // Generate token with user info
      const token = this.jwtService.sign({
        sub: userId,
        username: loginDto.username,
        roles: ['user'], // In a real app, roles would come from your user database
        // Add any other claims you need
      });
      
      // Store token info in Redis for potential future validation/revocation
      await this.redisService.set(
        `user_token:${userId}:${token.substring(0, 20)}`, 
        JSON.stringify({ 
          created: new Date().toISOString(),
          username: loginDto.username,
          active: true
        }),
        60 * 60 * 24 * 7  // Store for 7 days (or match your token expiry)
      );
      
      // Return the token to the client
      return {
        status: 'success',
        token,
        user: {
          id: userId,
          username: loginDto.username
        }
      };
    } catch (error) {
      this.logger.error(`Token generation failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Validates a JWT token and returns the decoded payload if valid
   */
  @Post('validate-token')
  async validateToken(@Body() tokenDto: TokenValidationDto) {
    try {
      if (!tokenDto.token) {
        throw new BadRequestException('Token is required');
      }
      
      // Use the ClientAuthService to validate the token
      const payload = await this.clientAuthService.validateToken(tokenDto.token);
      
      return {
        status: 'success',
        valid: true,
        payload
      };
    } catch (error) {
      this.logger.warn(`Token validation failed: ${error.message}`);
      return {
        status: 'error',
        valid: false,
        message: error.message
      };
    }
  }
  
  /**
   * Revokes a JWT token
   */
  @Post('revoke-token')
  async revokeToken(@Body() tokenDto: TokenValidationDto) {
    try {
      if (!tokenDto.token) {
        throw new BadRequestException('Token is required');
      }
      
      await this.clientAuthService.revokeToken(tokenDto.token);
      
      return {
        status: 'success',
        message: 'Token revoked successfully'
      };
    } catch (error) {
      this.logger.error(`Token revocation failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Broadcasts a message to all connected WebSocket clients
   */
  @Post('broadcast')
  async broadcastMessage(@Body() broadcastDto: BroadcastDto) {
    try {
      if (!broadcastDto.event || !broadcastDto.data) {
        throw new BadRequestException('Event and data are required');
      }
      
      const eventData = {
        ...broadcastDto.data,
        _meta: {
          source: 'api',
          timestamp: new Date().toISOString()
        }
      };
      
      if (broadcastDto.room) {
        // Send to specific room
        this.logger.log(`Broadcasting to room ${broadcastDto.room}: ${JSON.stringify(eventData)}`);
        this.wsGateway.server.to(broadcastDto.room).emit('outgoing_event', {
          event: broadcastDto.event,
          data: eventData
        });
      } else if (broadcastDto.clientId) {
        // Send to specific client
        this.logger.log(`Broadcasting to client ${broadcastDto.clientId}: ${JSON.stringify(eventData)}`);
        this.wsGateway.server.to(broadcastDto.clientId).emit('outgoing_event', {
          event: broadcastDto.event,
          data: eventData
        });
      } else {
        // Broadcast to all clients
        this.logger.log(`Broadcasting to all clients: ${JSON.stringify(eventData)}`);
        this.wsGateway.broadcastEvent({
          event: broadcastDto.event,
          data: eventData
        });
      }
      
      return {
        status: 'success',
        message: 'Message broadcasted successfully'
      };
    } catch (error) {
      this.logger.error(`Broadcasting failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get active WebSocket connections info
   */
  @Get('connections')
  getConnections() {
    // Get the number of connected clients from the gateway
    const totalConnections = this.wsGateway.getConnectedClientsCount();
    const authenticatedConnections = this.wsGateway.getAuthenticatedClientsCount();
    
    return {
      status: 'success',
      connections: {
        total: totalConnections,
        authenticated: authenticatedConnections,
        anonymous: totalConnections - authenticatedConnections
      }
    };
  }
  
  /**
   * Generate a test token for development/testing purposes
   * This should be disabled or protected in production
   */
  @Get('test-token')
  generateTestToken(@Query('username') username: string = 'test-user') {
    // This is for testing only
    const userId = `test-${uuidv4().substring(0, 8)}`;
    
    const token = this.jwtService.sign({
      sub: userId,
      username: username,
      roles: ['user'],
      isTest: true
    });
    
    return {
      status: 'success',
      token,
      message: 'TEST TOKEN - FOR DEVELOPMENT USE ONLY'
    };
  }
  
  // Helper methods
  
  /**
   * In a real application, this would check the database
   * This is just a simplified example for demonstration
   */
  private async validateUserCredentials(username: string, password: string): Promise<boolean> {
    // For demo: Check if the user exists in Redis
    const userKey = `user:${username}`;
    const userData = await this.redisService.get(userKey);
    
    if (userData) {
      // User exists, validate password (in a real app, you'd use bcrypt)
      const user = JSON.parse(userData);
      return user.password === password;
    } else if (username && password) {
      // For demo: Auto-register new users
      // In production, you'd have a separate registration process
      await this.redisService.set(
        userKey,
        JSON.stringify({ 
          username, 
          password, // In production, NEVER store plain passwords, use bcrypt
          createdAt: new Date().toISOString()
        }),
        60 * 60 * 24 * 30 // Store for 30 days
      );
      return true;
    }
    
    return false;
  }
  
  /**
   * Get or generate a user ID
   */
  private async getUserId(username: string): Promise<string> {
    const userKey = `user:${username}`;
    const userData = await this.redisService.get(userKey);
    
    if (userData) {
      const user = JSON.parse(userData);
      if (user.id) {
        return user.id;
      }
      
      // Generate an ID if none exists
      const userId = uuidv4();
      user.id = userId;
      
      await this.redisService.set(
        userKey,
        JSON.stringify(user),
        60 * 60 * 24 * 30 // Store for 30 days
      );
      
      return userId;
    }
    
    // Fallback to generating a new ID
    return uuidv4();
  }

  /**
   * Initialize endpoint that authenticates and creates channels
   * 
   * Example payload:
   * {
   *   "auth": {},
   *   "event": "initialize",
   *   "payload": {
   *     "channels": ["channel1", "channel2"]
   *   }
   * }
   */
  @Post('initialize')
  async initialize(@Body() initializeDto: InitializeDto) {
    try {
      this.logger.log(`Initialize request received: ${JSON.stringify(initializeDto)}`);
      
      // 1. Validate request format
      if (initializeDto.event !== 'initialize') {
        throw new BadRequestException('Event must be "initialize"');
      }
      
      if (!initializeDto.payload || !Array.isArray(initializeDto.payload.channels)) {
        throw new BadRequestException('Invalid payload format. Channels array is required.');
      }
      
      // 2. Authentication logic
      let authenticatedUserId = null;
      
      // If auth info is provided, validate it
      if (initializeDto.auth && Object.keys(initializeDto.auth).length > 0) {
        // For JWT token in auth.token
        if (initializeDto.auth.token) {
          try {
            const payload = await this.clientAuthService.validateToken(initializeDto.auth.token);
            authenticatedUserId = payload.sub || payload.id;
            this.logger.log(`Authenticated user: ${authenticatedUserId}`);
          } catch (error) {
            this.logger.warn(`Authentication failed: ${error.message}`);
            // Continue without authentication
          }
        } 
        // Add other auth methods as needed
      }
      
      // 3. Create or ensure channels exist
      const channelResults = await Promise.all(
        initializeDto.payload.channels.map(async (channelId) => {
          // Store channel info in Redis for persistence
          const channelKey = `channel:${channelId}`;
          const channelExists = await this.redisService.exists(channelKey);
          
          if (!channelExists) {
            // Create new channel
            await this.redisService.set(
              channelKey, 
              JSON.stringify({
                id: channelId,
                created: new Date().toISOString(),
                active: true,
                creator: authenticatedUserId || 'anonymous'
              })
            );
            
            this.logger.log(`Created new channel: ${channelId}`);
            return { channelId, status: 'created' };
          } else {
            this.logger.log(`Channel already exists: ${channelId}`);
            return { channelId, status: 'exists' };
          }
        })
      );
      
      // 4. Subscribe all connected clients to these channels
      this.wsGateway.joinClientsToChannels(initializeDto.payload.channels);
      
      return {
        status: 'success',
        message: 'Channels initialized successfully',
        channels: channelResults,
        authenticated: !!authenticatedUserId,
        sessionId: uuidv4() // Optional: provide a session ID for future reference
      };
    } catch (error) {
      this.logger.error(`Channel initialization failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Broadcast endpoint for sending messages to specific channels without authentication
   * 
   * Example payload:
   * {
   *   "event": "broadcast",
   *   "channel_ids": ["channel1"],
   *   "payload": {
   *     "message": "Hello from the server!"
   *   }
   * }
   */
  @Post('broadcast')
  async channelBroadcast(@Body() broadcastDto: ChannelBroadcastDto) {
    try {
      this.logger.log(`Broadcast request received: ${JSON.stringify(broadcastDto)}`);
      
      // 1. Validate request format
      if (broadcastDto.event !== 'broadcast') {
        throw new BadRequestException('Event must be "broadcast"');
      }
      
      if (!broadcastDto.channel_ids || !Array.isArray(broadcastDto.channel_ids) || broadcastDto.channel_ids.length === 0) {
        throw new BadRequestException('Invalid request. At least one channel_id is required.');
      }
      
      if (!broadcastDto.payload) {
        throw new BadRequestException('Payload is required');
      }
      
      // 2. Check if channels exist
      for (const channelId of broadcastDto.channel_ids) {
        const channelExists = await this.redisService.exists(`channel:${channelId}`);
        if (!channelExists) {
          this.logger.warn(`Channel ${channelId} does not exist, but will attempt to broadcast anyway`);
        }
      }
      
      // 3. Prepare broadcast message with metadata
      const messageData = {
        event: 'message',
        data: {
          ...broadcastDto.payload,
          _meta: {
            timestamp: new Date().toISOString(),
            source: 'api-broadcast',
            messageId: uuidv4()
          }
        }
      };
      
      // 4. Broadcast to each specified channel
      const results = broadcastDto.channel_ids.map(channelId => {
        // Broadcast to the channel (room in Socket.IO terminology)
        this.wsGateway.server.to(channelId).emit('outgoing_event', messageData);
        
        // Also publish to Redis for other potential consumers
        this.redisService.publish(`channel:${channelId}`, JSON.stringify(messageData));
        
        this.logger.log(`Broadcast sent to channel: ${channelId}`);
        return { channelId, status: 'broadcast_sent' };
      });
      
      return {
        status: 'success',
        message: 'Broadcast sent successfully',
        channels: results,
        messageId: messageData.data._meta.messageId
      };
    } catch (error) {
      this.logger.error(`Channel broadcast failed: ${error.message}`);
      throw error;
    }
  }
}