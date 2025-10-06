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
}

/**
 * Validation middleware for WebSocket messages
 * Validates the data structure of incoming messages
 */
@Injectable()
@Middleware({ priority: 40 }) // Runs after authentication, rate limiting, and logging
export class ValidationMiddleware extends BaseMiddleware {
  private readonly logger = new Logger(ValidationMiddleware.name);
  
  // Event schema definitions
  private readonly schemas = {
    'ping': {
      required: ['timestamp'],
      validate: (data: any) => typeof data.timestamp === 'number'
    },
    'authenticate': {
      required: ['token'],
      validate: (data: any) => typeof data.token === 'string' && data.token.length > 0
    },
    'protected': {
      required: ['data'],
      validate: (data: any) => typeof data.data === 'string'
    }
    // Add more event schemas as needed
  };

  async execute(context: WebSocketContext, next: () => Promise<void>): Promise<void> {
    const { client, event, data } = context;
    
    // Skip validation for events without defined schemas
    if (!this.schemas[event]) {
      return next();
    }
    
    const schema = this.schemas[event];
    let isValid = true;
    let errorMessage = '';
    
    try {
      // Check required fields
      for (const field of schema.required) {
        if (data === undefined || data === null || data[field] === undefined) {
          isValid = false;
          errorMessage = `Missing required field: ${field}`;
          break;
        }
      }
      
      // Run custom validation if all required fields are present
      if (isValid && schema.validate && !schema.validate(data)) {
        isValid = false;
        errorMessage = `Invalid data format for event: ${event}`;
      }
      
      if (!isValid) {
        this.logger.warn(`Validation error for ${event}: ${errorMessage}`);
        
        // Emit validation error to client
        client.emit('error', {
          code: 'VALIDATION_ERROR',
          message: errorMessage
        });
        
        // Store validation result in context
        context.metadata.validationError = errorMessage;
        context.metadata.isValid = false;
        
        // You can choose to stop the chain here or continue
        // For now, we'll continue but mark the request as invalid
      } else {
        // Mark as valid in context
        context.metadata.isValid = true;
      }
    } catch (error) {
      this.logger.error(`Error in validation middleware: ${error.message}`);
      context.metadata.validationError = error.message;
      context.metadata.isValid = false;
    }
    
    // Continue to the next middleware
    await next();
  }
}
