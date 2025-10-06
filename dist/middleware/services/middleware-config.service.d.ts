import { OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { MiddlewareConfig } from '../interfaces/middleware-config.interface';
export declare class MiddlewareConfigService implements OnModuleInit {
    private readonly redisService;
    private readonly logger;
    constructor(redisService: RedisService);
    onModuleInit(): Promise<void>;
    loadConfigFromFileToRedis(configPath?: string): Promise<void>;
    getAllConfigs(): Promise<MiddlewareConfig[]>;
    getConfigByKey(key: string): Promise<MiddlewareConfig | null>;
    setActiveMiddleware(keys: string[]): Promise<void>;
    getActiveMiddleware(): Promise<string[]>;
    resolveMiddlewareKeys(keys: string[]): Promise<string[]>;
}
