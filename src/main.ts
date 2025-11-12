import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerOptions } from './logger/winston-logger';
import { ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './router/redisio-adapter';
import { RedisService } from './redis/redis.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonLoggerOptions),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Pass the entire app context to the adapter
  const redisIoAdapter = new RedisIoAdapter(app);
  
  // Initialize the adapter
  await redisIoAdapter.connectToRedis();
  
  // Use the adapter for WebSocket connections
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(4000);
}
bootstrap();
