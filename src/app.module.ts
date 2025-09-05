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
import { ClientAuthService } from './sources/websocket/client-auth.service';

@Module({
  imports: [RedisModule,RouterModule, WebsocketModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig],
    }), KafkaModule.register()
  ],
    controllers: [ApiController],
  providers: [WSGateway, RedisService, RouterService, ClientAuthService],
})
export class AppModule {}