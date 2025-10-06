import { Injectable, Logger } from '@nestjs/common';
import { BaseMiddleware, Middleware } from '../base.middleware';
import { Socket } from 'socket.io';

/**
 * Interface for the WebSocket context
 */
interface WebSocketContext {
  client: Socket;
  event: string;
  data: any;
  metadata: Record<string, any>;
  timestamp: number;
}

/**
 * ErrorHandling middleware for WebSocket connections
 * Catches errors and provides consistent error response format
 * This middleware should be registered with very high priority (low number)
 * to wrap the entire middleware chain in try-catch
 */
@Injectable()
@Middleware({ priority: 5 }) // Runs before almost everything else
export class ErrorHandlingMiddleware extends BaseMiddleware {
  private readonly logger = new Logger(ErrorHandlingMiddleware.name);

  async execute(context: WebSocketContext, next: () => Promise<void>): Promise<void> {
    try {
      // Add error handling context
      context.metadata.errorHandling = {
        started: Date.now()
      };
      
      // Continue to the next middleware
      await next();
      
      // If we got here without errors, record success
      context.metadata.errorHandling.status = 'success';
      context.metadata.errorHandling.completed = Date.now();
      
    } catch (error) {
      // Record error
      context.metadata.errorHandling.status = 'error';
      context.metadata.errorHandling.error = error;
      context.metadata.errorHandling.completed = Date.now();
      
      this.logger.error(`Error processing event ${context.event}: ${error.message}`);
      
      // Format a consistent error response
      const errorResponse = {
        status: 'error',
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      };
      
      // Send error response to client
      context.client.emit('error', errorResponse);
      
      // Optionally log the error for debugging
      this.logger.debug(`Error details: ${JSON.stringify({
        event: context.event,
        clientId: context.client.id,
        error: errorResponse,
        data: context.data
      }, null, 2)}`);
      
      // Don't re-throw, we've handled it here
    }
  }
  
  /**
   * Generate a simple request ID for error tracking
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
