import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

//   This middleware handles authentication for WebSocket connections

@Injectable()
export class WsAuthMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService
  ) {}

 
  async authenticate(client: Socket): Promise<any> {
    try {
      const token = this.extractToken(client);
      
      if (!token) {
        client.data.isAuthenticated = false;
        client.data.authError = 'No authentication token provided';
        return null;
      }
      
      // Verify the token
      try {
        const payload = await this.verifyToken(token);
        
        // Store authentication information in socket data
        client.data.isAuthenticated = true;
        client.data.token = token;
        client.data.user = payload;
        client.data.userId = payload.sub || payload.id || payload.userId;
        client.data.authTime = Date.now();
        
        // If the user has a user ID, add them to a user-specific room
        if (client.data.userId) {
          client.join(`user:${client.data.userId}`);
        }
        
        return payload;
      } catch (error) {
        // Authentication failed
        client.data.isAuthenticated = false;
        client.data.authError = error.message;
        return null;
      }
    } catch (error) {
      client.data.isAuthenticated = false;
      client.data.authError = `Authentication error: ${error.message}`;
      return null;
    }
  }
  
  private extractToken(client: Socket): string | null {

    if (client.handshake.auth && client.handshake.auth.token) {
      return client.handshake.auth.token;
    }
    
    
    return null;
  }
  

  private async verifyToken(token: string): Promise<any> {
    try {
      // First try to verify normally
      const payload = this.jwtService.verify(token);
      
      // Check if the token has been revoked in Redis
      const isRevoked = await this.redisService.get(`revoked_token:${token}`);
      if (isRevoked) {
        throw new WsException('Token has been revoked');
      }
      
      return payload;
    } catch (error) {
      // For development and testing purposes only
      if (process.env.NODE_ENV !== 'production') {
        // Try to decode the token without verification
        try {
          // Check if it's the special test token from our test page
          // The token has this specific format
          if (token.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.')) {
            // Decode but don't verify - only for development/testing!
            const payload = this.jwtService.decode(token);
            if (payload && typeof payload === 'object') {
              return payload;
            }
          }
        } catch (decodeError) {
          // Ignore decode errors and throw the original error
        }
      }
      
      // If we're in production or token decode failed, throw the original error
      throw error;
    }
  }
}
