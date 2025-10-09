import { IoAdapter } from '@nestjs/platform-socket.io';
import { RedisService } from '../redis/redis.service';
import { INestApplicationContext } from '@nestjs/common';
export declare class RedisIoAdapter extends IoAdapter {
    private adapterConstructor;
    private redisService;
    constructor(redisServiceOrApp: RedisService | INestApplicationContext);
    connectToRedis(): Promise<void>;
    createIOServer(port: number, options?: any): any;
}
