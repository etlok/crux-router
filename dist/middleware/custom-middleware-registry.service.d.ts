import Redis from 'ioredis';
export declare class CustomMiddlewareRegistry {
    private readonly redis;
    private readonly logger;
    private middlewareDir;
    constructor(redis: Redis);
    private ensureMiddlewareDir;
    registerMiddleware(key: string, code: string, config?: Record<string, any>, metadata?: Record<string, any>): Promise<string>;
    updateMiddleware(key: string, code?: string, config?: Record<string, any>, metadata?: Record<string, any>): Promise<void>;
    deleteMiddleware(key: string): Promise<void>;
    getAllMiddleware(): Promise<Record<string, any>[]>;
    getMiddleware(key: string): Promise<Record<string, any> | null>;
}
