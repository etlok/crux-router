import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';
export declare class KafkaService implements OnModuleInit, OnModuleDestroy {
    private redisService;
    private routerService;
    private readonly configService;
    private kafka;
    private consumer;
    private producer;
    private readonly logger;
    private readonly MAX_RETRY_ATTEMPTS;
    private messageRetryCount;
    constructor(redisService: RedisService, routerService: RouterService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    private connectWithRetry;
    private handleFailedMessage;
    subscribeAndRun(): Promise<void>;
    sendMessage(topic: string, message: any): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
