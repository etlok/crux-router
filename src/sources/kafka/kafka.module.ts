import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaController } from './kafka.controller';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';

@Module({
  providers: [KafkaService, RedisService, RouterService],
  controllers: [KafkaController],
  exports: [KafkaService],
})
export class KafkaModule {}