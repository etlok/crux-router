import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseMiddleware, Middleware } from '../base.middleware';

/**
 * Authentication middleware for WebSocket connections
 * Extracts and validates JWT tokens from Socket.IO handshake
 */
@Injectable()
@Middleware({ priority: 10 }) // Authentication runs first (low priority number)
export class AuthenticationMiddleware extends BaseMiddleware {
  private readonly logger = new Logger(AuthenticationMiddleware.name);

  async execute(context: any, next: () => Promise<void>): Promise<void> {
    // Access authentication info from sourceContext
    if (context.sourceContext) {
      const { isAuthenticated, userId, userInfo } = context.sourceContext;
      
      // Store authentication info in context for other middleware
      context.isAuthenticated = isAuthenticated;
      context.userId = userId;
      context.userInfo = userInfo;
      
      if (isAuthenticated) {
        this.logger.log(`User is authenticated: ${userId || 'unknown'}`);
        
        // Store authentication result in middlewareResults for tracking
        if (context.metadata && context.metadata.middlewareResults) {
          context.metadata.middlewareResults.authentication = { 
            authenticated: true,
            userId,
            timestamp: new Date().toISOString()
          };
        }
      } else {
        this.logger.log('User is not authenticated');
        
        // Store authentication result in middlewareResults for tracking
        if (context.metadata && context.metadata.middlewareResults) {
          context.metadata.middlewareResults.authentication = { 
            authenticated: false,
            timestamp: new Date().toISOString()
          };
        }
      }
    } else {
      this.logger.warn('No source context found, skipping authentication');
      context.isAuthenticated = false;
    }
    
    // Always proceed to the next middleware
    await next();
  }
}
