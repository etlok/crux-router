import { forwardRef, Module } from '@nestjs/common';
import { RouterController } from './router.controller';
import { RouterService } from './router.service';
import { RedisProvider } from '../redis/redis.provider';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerOptions } from 'src/logger/winston-logger';
import { EventsModule } from '../events/events.module';
import { RedisLoggerService } from './redis-logger.service';

@Module({
  imports: [
    WinstonModule.forRoot(winstonLoggerOptions),
    forwardRef(() => EventsModule), // Use forward reference to avoid circular dependency
  ],
  controllers: [RouterController],
  providers: [RouterService, RedisProvider, RedisLoggerService],
  exports: [RouterService], // Export RouterService so it can be used by other modules
})
export class RouterModule {}
