import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisProvider } from './redis.provider';
import { RedisLoggerService } from 'src/router/redis-logger.service';

@Global()
@Module({
  providers: [RedisService, RedisProvider, RedisLoggerService],
  exports: [RedisService, 'REDIS_CLIENT', RedisLoggerService] , 
})
export class RedisModule {}