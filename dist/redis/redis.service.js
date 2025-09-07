"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("redis");
let RedisService = RedisService_1 = class RedisService {
    pubClient;
    subClient;
    logger = new common_1.Logger(RedisService_1.name);
    activeSubscriptions = new Set();
    subscriptionCallbacks = new Map();
    connectionHealthCheck;
    connectionAttempts = 0;
    lastReconnectTime = 0;
    connectionErrors = 0;
    constructor() {
        this.pubClient = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    this.connectionAttempts++;
                    this.lastReconnectTime = Date.now();
                    const delay = Math.min(1000 * 2 ** retries, 30000);
                    this.logger.warn(`Redis reconnect attempt #${retries}, retrying in ${delay}ms`);
                    return delay;
                },
            },
        });
        this.subClient = this.pubClient.duplicate();
        this.connectClients();
        this.connectionHealthCheck = setInterval(() => this.checkConnections(), 30000);
    }
    async connectClients() {
        try {
            await this.pubClient.connect();
            await this.subClient.connect();
            this.logger.log('Redis clients connected');
        }
        catch (err) {
            this.connectionErrors++;
            this.logger.error(`Redis connection error: ${err.message}`);
            setTimeout(() => this.connectClients(), 2000);
        }
        this.pubClient.on('error', (err) => {
            this.connectionErrors++;
            this.logger.error(`Redis pubClient error: ${err.message}`);
        });
        this.subClient.on('error', (err) => {
            this.connectionErrors++;
            this.logger.error(`Redis subClient error: ${err.message}`);
        });
    }
    async subscribe(channel, callback) {
        this.logger.log(`Subscribing to channel: ${channel}`);
        await this.subClient.subscribe(channel, (message) => {
            this.logger.debug(`Received message on ${channel}: ${message}`);
            callback(message);
        });
        this.activeSubscriptions.add(channel);
        this.subscriptionCallbacks.set(channel, callback);
    }
    async unsubscribe(channel) {
        if (this.activeSubscriptions.has(channel)) {
            this.logger.log(`Unsubscribing from channel: ${channel}`);
            await this.subClient.unsubscribe(channel);
            this.activeSubscriptions.delete(channel);
            this.subscriptionCallbacks.delete(channel);
        }
        else {
            this.logger.warn(`Attempted to unsubscribe from channel that wasn't subscribed: ${channel}`);
        }
    }
    async get(key) {
        try {
            const value = await this.pubClient.get(key);
            return value;
        }
        catch (err) {
            this.logger.error(`Error getting key ${key}: ${err.message}`);
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            if (ttl) {
                await this.pubClient.set(key, value, { EX: ttl });
            }
            else {
                await this.pubClient.set(key, value);
            }
        }
        catch (err) {
            this.logger.error(`Error setting key ${key}: ${err.message}`);
        }
    }
    async publish(channel, message) {
        this.logger.log(`Publishing to channel: ${channel} | message: ${message}`);
        await this.pubClient.publish(channel, message);
    }
    getPubClient() {
        return this.pubClient;
    }
    getSubClient() {
        return this.subClient;
    }
    async onModuleDestroy() {
        this.logger.log('Closing Redis clients');
        clearInterval(this.connectionHealthCheck);
        for (const channel of this.activeSubscriptions) {
            try {
                await this.subClient.unsubscribe(channel);
            }
            catch (err) {
                this.logger.error(`Error unsubscribing from ${channel} during shutdown: ${err.message}`);
            }
        }
        await this.pubClient.quit();
        await this.subClient.quit();
    }
    async exists(key) {
        try {
            const result = await this.pubClient.exists(key);
            return result === 1;
        }
        catch (err) {
            this.logger.error(`Error checking if key ${key} exists: ${err.message}`);
            return false;
        }
    }
    async del(key) {
        try {
            await this.pubClient.del(key);
        }
        catch (err) {
            this.logger.error(`Error deleting key ${key}: ${err.message}`);
        }
    }
    async keys(pattern) {
        try {
            return await this.pubClient.keys(pattern);
        }
        catch (err) {
            this.logger.error(`Error getting keys with pattern ${pattern}: ${err.message}`);
            return [];
        }
    }
    async lpush(key, value) {
        try {
            return await this.pubClient.lPush(key, value);
        }
        catch (err) {
            this.logger.error(`Error on LPUSH to ${key}: ${err.message}`);
            return 0;
        }
    }
    async rpop(key) {
        try {
            return await this.pubClient.rPop(key);
        }
        catch (err) {
            this.logger.error(`Error on RPOP from ${key}: ${err.message}`);
            return null;
        }
    }
    async hset(key, field, value) {
        try {
            return await this.pubClient.hSet(key, field, value);
        }
        catch (err) {
            this.logger.error(`Error on HSET to ${key}.${field}: ${err.message}`);
            return 0;
        }
    }
    async hget(key, field) {
        try {
            return await this.pubClient.hGet(key, field);
        }
        catch (err) {
            this.logger.error(`Error on HGET from ${key}.${field}: ${err.message}`);
            return null;
        }
    }
    async hgetall(key) {
        try {
            return await this.pubClient.hGetAll(key);
        }
        catch (err) {
            this.logger.error(`Error on HGETALL from ${key}: ${err.message}`);
            return {};
        }
    }
    getMetrics() {
        return {
            connections: {
                pubClientConnected: this.pubClient.isOpen,
                subClientConnected: this.subClient.isOpen,
                reconnectionAttempts: this.connectionAttempts,
                lastReconnectTime: this.lastReconnectTime,
                connectionErrors: this.connectionErrors
            },
            subscriptions: {
                activeCount: this.activeSubscriptions.size,
                channels: Array.from(this.activeSubscriptions)
            }
        };
    }
    async checkConnections() {
        try {
            if (!this.pubClient.isOpen) {
                this.logger.warn('Pub client disconnected, attempting reconnect');
                await this.pubClient.connect();
            }
            if (!this.subClient.isOpen) {
                this.logger.warn('Sub client disconnected, attempting reconnect');
                await this.subClient.connect();
                for (const channel of this.activeSubscriptions) {
                    const callback = this.subscriptionCallbacks.get(channel);
                    if (callback) {
                        this.logger.log(`Resubscribing to ${channel} after reconnect`);
                        await this.subClient.subscribe(channel, callback);
                    }
                }
            }
        }
        catch (err) {
            this.connectionErrors++;
            this.logger.error(`Health check failed: ${err.message}`);
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
//# sourceMappingURL=redis.service.js.map