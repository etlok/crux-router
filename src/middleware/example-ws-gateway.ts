import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseInterceptors } from '@nestjs/common';
import { Socket } from 'socket.io';
import { DynamicWsMiddlewareInterceptor } from './dynamic-ws-middleware.interceptor';

/**
 * Example WebSocket Gateway using dynamic middleware
 *
 * This shows how to integrate the dynamic middleware system
 * with a NestJS WebSocket gateway.
 */
@UseInterceptors(DynamicWsMiddlewareInterceptor) // Apply middleware interceptor
@WebSocketGateway({
  cors: {
    origin: '*', // For development
  },
})
export class ExampleWebSocketGateway {
  /**
   * Handle connection event
   */
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // The client connection will be handled by the middleware chain
    // No need to manually check authentication here
  }

  /**
   * Handle disconnection event
   */
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Handle ping event
   *
   * This is automatically processed by:
   * 1. ErrorHandlingMiddleware
   * 2. AuthenticationMiddleware (but doesn't require auth)
   * 3. RateLimitingMiddleware
   * 4. LoggingMiddleware
   * 5. ValidationMiddleware (validates timestamp field)
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    // The middleware chain has already processed this event

    // We can now handle the business logic
    return {
      event: 'pong',
      data: { received: data.timestamp, sent: Date.now() },
    };
  }

  /**
   * Handle authentication event
   *
   * This will be processed by:
   * 1. ErrorHandlingMiddleware
   * 2. AuthenticationMiddleware
   * 3. RateLimitingMiddleware (skipped for authenticate events)
   * 4. LoggingMiddleware
   * 5. ValidationMiddleware (validates token field)
   */
  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // The authentication middleware has already validated the token
    // and set client.data.isAuthenticated and client.data.user

    if (client.data.isAuthenticated) {
      return {
        event: 'authenticated',
        data: {
          success: true,
          message: 'Authentication successful',
          user: {
            id: client.data.user.sub,
            name: client.data.user.name,
          },
        },
      };
    } else {
      return {
        event: 'authenticated',
        data: {
          success: false,
          message: client.data.authError || 'Authentication failed',
        },
      };
    }
  }

  /**
   * Handle protected event (requires authentication)
   *
   * This will be processed by:
   * 1. ErrorHandlingMiddleware
   * 2. AuthenticationMiddleware
   * 3. RateLimitingMiddleware
   * 4. LoggingMiddleware
   * 5. ValidationMiddleware
   *
   * Then we manually check authentication status
   */
  @SubscribeMessage('protected')
  handleProtected(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    // Check if authenticated
    if (!client.data.isAuthenticated) {
      // Send error response
      client.emit('error', {
        code: 'UNAUTHORIZED',
        message: 'Authentication required for this action',
      });
      return;
    }

    // Handle the authenticated event
    return {
      event: 'protected-response',
      data: {
        message: 'You have accessed a protected event',
        user: client.data.user,
        receivedData: data,
      },
    };
  }

  /**
   * Handle event that triggers an error
   */
  @SubscribeMessage('trigger-error')
  handleError() {
    // This error will be caught by the ErrorHandlingMiddleware
    throw new Error('This is a test error');
  }
}
