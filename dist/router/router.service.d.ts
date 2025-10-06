import { LoggerService } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisLoggerService } from './redis-logger.service';
import { WorkerLogEmitterService } from '../events/worker-log-emitter.service';
export declare class RouterService {
    private readonly redis;
    private readonly logger;
    private readonly redisLoggerService;
    private readonly workerLogEmitterService;
    constructor(redis: Redis, logger: LoggerService, redisLoggerService: RedisLoggerService, workerLogEmitterService: WorkerLogEmitterService);
    routeEvent(workflowName: string, metadata?: any): Promise<{
        status: string;
        workflow_instance_id: string;
        request_id: string;
        steps: string[];
    }>;
}
