import { DynamicModule, Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaController } from './kafka.controller';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NoopKafkaService } from './noop-kafka.sevice';

@Module({})
export class KafkaModule {
  static register(): DynamicModule {
    return {
      module: KafkaModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: KafkaService,
          useFactory: (configService: ConfigService) => {
            if (!configService.get('features.enableKafka')) {
              return new NoopKafkaService();
            }
         
          },
          inject: [ConfigService],
        },
      ],
      exports: [KafkaService],
    };
  }
}