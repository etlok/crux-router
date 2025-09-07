import { LoggerService } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisLoggerService } from './redis-logger.service';
export declare class RouterService {
    private readonly redis;
    private readonly logger;
    private readonly redisLoggerService;
    constructor(redis: Redis, logger: LoggerService, redisLoggerService: RedisLoggerService);
    routeEvent(eventName: string, metadata?: any): Promise<{
        status: string;
        workflow_instance_id: string;
        request_id: string;
    }>;
}
