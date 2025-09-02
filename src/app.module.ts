import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { ApiController } from './sources/api/api.controller';
import { WSGateway } from './sources/websocket/websocket.gateway';
import { RedisService } from './redis/redis.service';
import { ConfigModule } from '@nestjs/config';
import redisConfig from './config/redis.config';
import { RouterModule } from './router/router.module';
import { KafkaModule } from './sources/kafka/kafka.module';
import { WebsocketModule } from './sources/websocket/websocket.module';
import { RouterService } from './router/router.service';

@Module({
  imports: [RedisModule,RouterModule,KafkaModule, WebsocketModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig],
    }),
  ],
    controllers: [ApiController],
  providers: [WSGateway, RedisService, RouterService],
})
export class AppModule {}