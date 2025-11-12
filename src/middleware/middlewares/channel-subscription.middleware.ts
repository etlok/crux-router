import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseMiddleware, Middleware } from '../base.middleware';


//   Channel Subscription Middleware for WebSocket connections
//   Subscribes authenticated users to allowed channels (e.g., user, entity)
 
@Injectable()
@Middleware({ priority: 20 }) 
export class ChannelSubscriptionMiddleware extends BaseMiddleware {
  private readonly logger = new Logger(ChannelSubscriptionMiddleware.name);

  async execute(context: any, next: () => Promise<void>): Promise<void> {
    const { isAuthenticated, userId, userInfo, socket } = context;

    if (!socket || !(socket instanceof Socket)) {
      this.logger.warn('No valid socket found in context');
      await next();
      return;
    }

    if (isAuthenticated && userId) {
      //Subscribe to user-specific and entity channels
      const userChannel = `user:${userId}`;
      socket.join(userChannel);
      this.logger.log(`Subscribed user ${userId} to channel: ${userChannel}`);

      // Subscribe to entity channels if userInfo has entities
      if (userInfo && Array.isArray(userInfo.entities)) {
        userInfo.entities.forEach((entityId: string) => {
          const entityChannel = `entity:${entityId}`;
          socket.join(entityChannel);
          this.logger.log(`Subscribed user ${userId} to entity channel: ${entityChannel}`);
        });
      }

      // Store subscription info in middlewareResults for tracking
      if (context.metadata && context.metadata.middlewareResults) {
        context.metadata.middlewareResults.channelSubscription = {
          userId,
          subscribedChannels: [
            userChannel,
            ...(userInfo?.entities?.map(id => `entity:${id}`) || [])
          ],
          timestamp: new Date().toISOString()
        };
      }
    } else {
      this.logger.warn('Auth portion Failed, skipping channel subscription');
    }

    await next();
  }
}