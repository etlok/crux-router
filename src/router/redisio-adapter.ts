// Create a Redis adapter for Socket.IO
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { INestApplicationContext } from '@nestjs/common';

@Injectable()
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private redisService: RedisService;
  
  constructor(redisServiceOrApp: RedisService | INestApplicationContext) {
    // Check if it's an application context or a direct service
    if (redisServiceOrApp instanceof RedisService) {
      // Direct RedisService injection
      super();
      this.redisService = redisServiceOrApp;
    } else {
      // It's an app context
      super(redisServiceOrApp);
      this.redisService = redisServiceOrApp.get<RedisService>(RedisService);
    }
  }

  async connectToRedis(): Promise<void> {
    // Get Redis clients from the RedisService
    const { pubClient, subClient } = await this.redisService.getSocketClients();
    
    // Create Socket.IO Redis adapter
    this.adapterConstructor = createAdapter(pubClient as any, subClient as any);
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
