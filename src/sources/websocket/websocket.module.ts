import { Module } from '@nestjs/common';
import { AppGateway } from './websocket.gateway';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';

@Module({
  providers: [AppGateway, RedisService, RouterService],
  exports: [AppGateway],
})
export class WebsocketModule {}