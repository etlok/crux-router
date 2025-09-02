import { Module } from '@nestjs/common';
import { RouterController } from './router.controller';
import { RouterService } from './router.service';
import { RedisProvider } from '../redis/redis.provider';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerOptions } from 'src/logger/winston-logger';

@Module({
  imports:[
        WinstonModule.forRoot(winstonLoggerOptions)

  ],
  controllers: [RouterController],
  providers: [RouterService, RedisProvider],
})
export class RouterModule {}
