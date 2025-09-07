import Redis from 'ioredis';
export declare class RedisLoggerService {
    private readonly redis;
    constructor(redis: Redis);
    logRequest(source: string, eventName: string, payload: any): Promise<void>;
    logResponse(source: string, eventName: string, response: any): Promise<void>;
    getRecentLogs(count?: number): Promise<any[]>;
}
