import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { ApiController } from './sources/api/api.controller';
import { WSGateway } from './sources/websocket/websocket.gateway';
import { RedisService } from './redis/redis.service';
import { ConfigModule } from '@nestjs/config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import { RouterModule } from './router/router.module';
import { KafkaModule } from './sources/kafka/kafka.module';
import { WebsocketModule } from './sources/websocket/websocket.module';
import { RouterService } from './router/router.service';
import { ClientAuthService } from './sources/websocket/client-auth.service';
import { JwtModule } from './auth/jwt.module';
import { MiddlewareModule } from './middleware/middleware.module';
import { FileParserModule } from './file-parser/file-parser.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    RedisModule,
    RouterModule,
    WebsocketModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig, jwtConfig],
    }),
    JwtModule,
    MiddlewareModule,
    FileParserModule,
    EventsModule,
    KafkaModule.register()
  ],
    controllers: [ApiController],
  providers: [WSGateway, RedisService, RouterService, ClientAuthService],
})
export class AppModule {}