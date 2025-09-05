import { Module } from '@nestjs/common';
import { WSGateway } from './websocket.gateway';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';
import { ClientAuthService } from './client-auth.service';

@Module({
  providers: [WSGateway, RedisService, RouterService, ClientAuthService],
  exports: [WSGateway],
  
})
export class WebsocketModule {}