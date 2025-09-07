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
}