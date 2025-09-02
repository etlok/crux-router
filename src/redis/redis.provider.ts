import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const port = configService.get<number>('redis.port');
    const host = configService.get<string>('redis.host');

    const client = new Redis({ port, host });

    client.on('connect', () => console.log('Redis connected'));
    client.on('error', (err) => console.error('Redis error', err));

    return client;
  },
};
