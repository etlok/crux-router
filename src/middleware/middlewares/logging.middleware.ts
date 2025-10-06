import { Injectable, Logger } from '@nestjs/common';
import { BaseMiddleware, Middleware } from '../base.middleware';

/**
 * Logging middleware for WebSocket connections
 * Records information about each socket event
 */
@Injectable()
@Middleware({ priority: 30 }) // Runs after authentication and rate limiting
export class LoggingMiddleware extends BaseMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  async execute(context: { client: any, event: string, data: any }, next: () => Promise<void>): Promise<void> {
    const { client, event, data } = context;
    const startTime = Date.now();
    
    // Log the event
    this.logger.log(`Event received: ${event} from ${client.id}`);
    
    // Add timestamp to the context
//    context.receivedAt = new Date().toISOString();
    
    try {
      // Continue to the next middleware
      await next();
      
      // Log completion time
      const duration = Date.now() - startTime;
      this.logger.debug(`Event ${event} processed in ${duration}ms`);
    } catch (error) {
      // Log errors
      this.logger.error(`Error processing event ${event}: ${error.message}`);
      throw error;
    }
  }
}
