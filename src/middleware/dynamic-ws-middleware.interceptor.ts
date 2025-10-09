import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { MiddlewareLoaderService } from './middleware-loader.service';

/**
 * WebSocket interceptor that applies the dynamic middleware chain
 */
@Injectable()
export class DynamicWsMiddlewareInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DynamicWsMiddlewareInterceptor.name);
  private initialized = false;

  constructor(private middlewareLoader: MiddlewareLoaderService) {}

  /**
   * Intercept method that runs before each WebSocket message handler
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Make sure middleware is initialized
    if (!this.initialized) {
      await this.middlewareLoader.initializeMiddleware();
      this.initialized = true;
    }

    // Only apply to WebSocket contexts
    if (context.getType() !== 'ws') {
      return next.handle();
    }

    // Get WebSocket specific data
    const client = context.switchToWs().getClient<Socket>();
    const data = context.switchToWs().getData();
    const eventInfo = context.getArgByIndex(2);
    const event = eventInfo?.event || 'unknown';

    // Create middleware context
    const middlewareContext = {
      client,
      data,
      event,
      eventInfo,
      timestamp: Date.now(),
      metadata: {},
    };

    try {
      // Execute all middleware
      await this.middlewareLoader.executeMiddlewareChain(middlewareContext);

      // Continue with request handling
      return next.handle();
    } catch (error) {
      this.logger.error(`Middleware chain error: ${error.message}`);
      throw error;
    }
  }
}
