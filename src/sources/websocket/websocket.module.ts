import { Module } from '@nestjs/common';
import { WSGateway } from './websocket.gateway';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';
import { ClientAuthService } from './client-auth.service';
import { WebSocketController } from './websocket.controller';
import { MiddlewareModule } from 'src/middleware/middleware.module';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [
    MiddlewareModule, // Import the MiddlewareModule to access its exported providers
    EventsModule, // Import EventsModule for event processing
  ],
  providers: [
    WSGateway,
    RedisService,
    RouterService,
    ClientAuthService,
  ],
  controllers: [WebSocketController],
  exports: [WSGateway],
})
export class WebsocketModule {}
