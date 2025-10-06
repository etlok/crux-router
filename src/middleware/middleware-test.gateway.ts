import { Controller } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MiddlewareLoaderService } from './middleware-loader.service';
import { MiddlewareContext } from './interfaces/middleware-context.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MiddlewareTestGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MiddlewareTestGateway.name);

  constructor(private readonly middlewareLoaderService: MiddlewareLoaderService) {}

  async onModuleInit() {
    // Initialize the middleware loader service
    await this.middlewareLoaderService.initializeMiddleware();
    this.logger.log('Middleware Test Gateway initialized with middleware service');
  }

  @SubscribeMessage('auth.test')
  async handleAuthTest(client: Socket, payload: any): Promise<any> {
    this.logger.log(`Received auth.test from ${client.id}: ${JSON.stringify(payload)}`);
    
    const context: MiddlewareContext = {
      client,
      event: 'auth.test',
      data: payload,
      sourceContext: { client },
      middlewareResults: {}
    };

    try {
      // Create a filtered middleware chain just for auth
      const authMiddlewares = this.middlewareLoaderService.getMiddlewares()
        .filter(m => m.name === 'authentication' && m.enabled);
      
      if (authMiddlewares.length > 0) {
        let index = 0;
        const next = async () => {
          if (index >= authMiddlewares.length) return;
          const currentMiddleware = authMiddlewares[index++];
          await currentMiddleware.middlewareInstance.execute(context, next);
        };
        
        await next();
      }
      
      // Return results
      return { 
        success: true, 
        message: 'Authentication middleware executed', 
        isAuthenticated: context.sourceContext?.client?.data?.isAuthenticated || false,
        middlewareResults: context.middlewareResults || {}
      };
    } catch (error) {
      this.logger.error(`Error in auth.test: ${error.message}`, error.stack);
      return { 
        success: false, 
        error: error.message,
        middlewareResults: context.middlewareResults || {}
      };
    }
  }

  @SubscribeMessage('logging.test')
  async handleLoggingTest(client: Socket, payload: any): Promise<any> {
    this.logger.log(`Received logging.test from ${client.id}: ${JSON.stringify(payload)}`);
    
    const context: MiddlewareContext = {
      client,
      event: 'logging.test',
      data: payload,
      sourceContext: { client },
      middlewareResults: {}
    };

    try {
      // Execute only logging middleware
      const loggingMiddlewares = this.middlewareLoaderService.getMiddlewares()
        .filter(m => m.name === 'logging' && m.enabled);
      
      if (loggingMiddlewares.length > 0) {
        let index = 0;
        const next = async () => {
          if (index >= loggingMiddlewares.length) return;
          const currentMiddleware = loggingMiddlewares[index++];
          await currentMiddleware.middlewareInstance.execute(context, next);
        };
        
        await next();
      }
      
      return { 
        success: true, 
        message: 'Logging middleware executed',
        middlewareResults: context.middlewareResults || {}
      };
    } catch (error) {
      this.logger.error(`Error in logging.test: ${error.message}`, error.stack);
      return { 
        success: false, 
        error: error.message,
        middlewareResults: context.middlewareResults || {}
      };
    }
  }

  @SubscribeMessage('validation.test')
  async handleValidationTest(client: Socket, payload: any): Promise<any> {
    this.logger.log(`Received validation.test from ${client.id}: ${JSON.stringify(payload)}`);
    
    const context: MiddlewareContext = {
      client,
      event: 'validation.test',
      data: payload,
      sourceContext: { client },
      middlewareResults: {}
    };

    try {
      // Execute only validation middleware
      const validationMiddlewares = this.middlewareLoaderService.getMiddlewares()
        .filter(m => m.name === 'validation' && m.enabled);
      
      if (validationMiddlewares.length > 0) {
        let index = 0;
        const next = async () => {
          if (index >= validationMiddlewares.length) return;
          const currentMiddleware = validationMiddlewares[index++];
          await currentMiddleware.middlewareInstance.execute(context, next);
        };
        
        await next();
      }
      
      return { 
        success: true, 
        message: 'Validation middleware executed',
        middlewareResults: context.middlewareResults || {}
      };
    } catch (error) {
      this.logger.error(`Error in validation.test: ${error.message}`, error.stack);
      return { 
        success: false, 
        error: error.message,
        middlewareResults: context.middlewareResults || {}
      };
    }
  }

  @SubscribeMessage('error.test')
  async handleErrorTest(client: Socket, payload: any): Promise<any> {
    this.logger.log(`Received error.test from ${client.id}: ${JSON.stringify(payload)}`);
    
    const context: MiddlewareContext = {
      client,
      event: 'error.test',
      data: payload,
      sourceContext: { client },
      middlewareResults: {}
    };

    try {
      // If triggerError is true, throw an error before middleware
      if (payload.triggerError) {
        throw new Error('Test error triggered by client request');
      }
      
      // Execute only error-handling middleware
      const errorMiddlewares = this.middlewareLoaderService.getMiddlewares()
        .filter(m => m.name === 'error-handling' && m.enabled);
      
      if (errorMiddlewares.length > 0) {
        let index = 0;
        const next = async () => {
          if (index >= errorMiddlewares.length) return;
          const currentMiddleware = errorMiddlewares[index++];
          await currentMiddleware.middlewareInstance.execute(context, next);
        };
        
        await next();
      }
      
      return { 
        success: true, 
        message: 'Error handling middleware executed',
        middlewareResults: context.middlewareResults || {},
        error: context.error ? context.error.message : null
      };
    } catch (error) {
      this.logger.error(`Error in error.test: ${error.message}`, error.stack);
      
      // Try to run error middleware explicitly to handle this
      try {
        const errorMiddleware = this.middlewareLoaderService.getMiddlewares()
          .find(m => m.name === 'error-handling' && m.enabled);
        
        if (errorMiddleware) {
          context.error = error;
          await errorMiddleware.middlewareInstance.execute(context, async () => {});
        }
      } catch (e) {
        this.logger.error(`Error in error handler: ${e.message}`);
      }
      
      return { 
        success: false, 
        error: error.message,
        handled: !!context.error,
        middlewareResults: context.middlewareResults || {}
      };
    }
  }

  @SubscribeMessage('rate-limit.test')
  async handleRateLimitTest(client: Socket, payload: any): Promise<any> {
    this.logger.log(`Received rate-limit.test from ${client.id}: ${JSON.stringify(payload)}`);
    
    const context: MiddlewareContext = {
      client,
      event: 'rate-limit.test',
      data: payload,
      sourceContext: { client },
      middlewareResults: {}
    };

    try {
      // Execute only rate limiting middleware
      const rateLimitMiddlewares = this.middlewareLoaderService.getMiddlewares()
        .filter(m => m.name === 'rate-limiting' && m.enabled);
      
      if (rateLimitMiddlewares.length > 0) {
        let index = 0;
        const next = async () => {
          if (index >= rateLimitMiddlewares.length) return;
          const currentMiddleware = rateLimitMiddlewares[index++];
          await currentMiddleware.middlewareInstance.execute(context, next);
        };
        
        await next();
      }
      
      return { 
        success: true, 
        message: 'Rate limiting middleware executed',
        middlewareResults: context.middlewareResults || {}
      };
    } catch (error) {
      this.logger.error(`Error in rate-limit.test: ${error.message}`, error.stack);
      return { 
        success: false, 
        error: error.message,
        middlewareResults: context.middlewareResults || {}
      };
    }
  }

  @SubscribeMessage('custom.event')
  async handleCustomEvent(client: Socket, payload: any): Promise<any> {
    this.logger.log(`Received custom.event from ${client.id}: ${JSON.stringify(payload)}`);
    
    const context: MiddlewareContext = {
      client,
      event: 'custom.event',
      data: payload,
      sourceContext: { client },
      middlewareResults: {}
    };

    try {
      // Execute the entire middleware chain
      await this.middlewareLoaderService.executeMiddlewareChain(context);
      
      // Return success response
      return { 
        success: true, 
        message: 'Custom event processed through middleware chain',
        middlewareResults: context.middlewareResults || {}
      };
    } catch (error) {
      this.logger.error(`Error in custom.event: ${error.message}`, error.stack);
      return { 
        success: false, 
        error: error.message,
        middlewareResults: context.middlewareResults || {}
      };
    }
  }
}
