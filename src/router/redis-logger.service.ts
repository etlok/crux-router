import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisLoggerService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async logRequest(source: string, eventName: string, payload: any) {
    const log = {
      type: 'request',
      source,
      eventName,
      payload,
      timestamp: new Date().toISOString(),
    };
    await this.redis.lpush('activity:logs', JSON.stringify(log));
  }

  async logResponse(source: string, eventName: string, response: any) {
    const log = {
      type: 'response',
      source,
      eventName,
      response,
      timestamp: new Date().toISOString(),
    };
    await this.redis.lpush('activity:logs', JSON.stringify(log));
  }


  async getRecentLogs(count = 100) {
    const logs = await this.redis.lrange('activity:logs', 0, count - 1);
    return logs.map((l) => JSON.parse(l));
  }
}