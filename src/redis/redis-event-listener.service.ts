// redis-event-listener.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';
import { WebSocketGateway } from '@nestjs/websockets';
import { AppGateway } from 'src/sources/websocket/websocket.gateway';

@Injectable()
export class RedisEventListenerService implements OnModuleInit {
  constructor(
    private readonly redisService: RedisService,
    private readonly socketGateway: AppGateway, // adjust based on your implementation
  ) {}

  async onModuleInit() {
    await this.redisService.subscribe('global-events', (message) => {
      // Broadcast this to WebSocket clients
      this.socketGateway.broadcastEvent(message);
    });
  }
}
