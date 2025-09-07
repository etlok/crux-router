import { Module } from '@nestjs/common';
import { WSGateway } from './websocket.gateway';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';
import { ClientAuthService } from './client-auth.service';
import { WebSocketController } from './websocket.controller';

@Module({
  providers: [WSGateway, RedisService, RouterService, ClientAuthService],
  controllers: [WebSocketController],
  exports: [WSGateway],
})
export class WebsocketModule {}