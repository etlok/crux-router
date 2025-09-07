import { OnModuleDestroy } from '@nestjs/common';
import { RedisClientType } from 'redis';
export declare class RedisService implements OnModuleDestroy {
    private pubClient;
    private subClient;
    private readonly logger;
    private activeSubscriptions;
    private subscriptionCallbacks;
    private connectionHealthCheck;
    private connectionAttempts;
    private lastReconnectTime;
    private connectionErrors;
    constructor();
    private connectClients;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    publish(channel: string, message: string): Promise<void>;
    getPubClient(): RedisClientType;
    getSubClient(): RedisClientType;
    onModuleDestroy(): Promise<void>;
    exists(key: string): Promise<boolean>;
    del(key: string): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    lpush(key: string, value: string): Promise<number>;
    rpop(key: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<number>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string>>;
    getMetrics(): {
        connections: {
            pubClientConnected: boolean;
            subClientConnected: boolean;
            reconnectionAttempts: number;
            lastReconnectTime: number;
            connectionErrors: number;
        };
        subscriptions: {
            activeCount: number;
            channels: string[];
        };
    };
    private checkConnections;
}
