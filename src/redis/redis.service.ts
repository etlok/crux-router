// redis.service.ts

import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private pubClient: RedisClientType;
  private subClient: RedisClientType;
  private readonly logger = new Logger(RedisService.name);
  private activeSubscriptions: Set<string> = new Set();
  private subscriptionCallbacks = new Map<string, (message: string) => void>();
  private connectionHealthCheck: NodeJS.Timeout;
  private connectionAttempts = 0;
  private lastReconnectTime = 0;
  private connectionErrors = 0;

  constructor() {
   this.pubClient = createClient({
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


     // Add health check interval
    this.connectionHealthCheck = setInterval(() => this.checkConnections(), 30000);
  }

  private async connectClients() {
    try {
      await this.pubClient.connect();
      await this.subClient.connect();
      this.logger.log('Redis clients connected');
    } catch (err) {
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

  async subscribe(channel: string, callback: (message: string) => void) {
    this.logger.log(`Subscribing to channel: ${channel}`);
    await this.subClient.subscribe(channel, (message) => {
      this.logger.debug(`Received message on ${channel}: ${message}`);
      callback(message);
    });

        this.activeSubscriptions.add(channel);
            this.subscriptionCallbacks.set(channel, callback);


  }

  
  async unsubscribe(channel: string): Promise<void> {
    if (this.activeSubscriptions.has(channel)) {
      this.logger.log(`Unsubscribing from channel: ${channel}`);
      await this.subClient.unsubscribe(channel);
      this.activeSubscriptions.delete(channel);
      this.subscriptionCallbacks.delete(channel);
    } else {
      this.logger.warn(`Attempted to unsubscribe from channel that wasn't subscribed: ${channel}`);
    }
  }



    /**
   * Get a value from Redis by key
   * @param key The key to retrieve
   * @returns The stored value or null if not found
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await this.pubClient.get(key);
      return value;
    } catch (err) {
      this.logger.error(`Error getting key ${key}: ${err.message}`);
      return null;
    }
  }


    /**
   * Set a value in Redis
   * @param key The key to set
   * @param value The value to store
   * @param ttl Optional TTL in seconds
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.pubClient.set(key, value, { EX: ttl });
      } else {
        await this.pubClient.set(key, value);
      }
    } catch (err) {
      this.logger.error(`Error setting key ${key}: ${err.message}`);
    }
  }


  async publish(channel: string, message: string) {
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
    
    // Unsubscribe from all channels
    for (const channel of this.activeSubscriptions) {
      try {
        await this.subClient.unsubscribe(channel);
      } catch (err) {
        this.logger.error(`Error unsubscribing from ${channel} during shutdown: ${err.message}`);
      }
    }
    
    await this.pubClient.quit();
    await this.subClient.quit();
  }

  async exists(key: string): Promise<boolean> {
  try {
    const result = await this.pubClient.exists(key);
    return result === 1;
  } catch (err) {
    this.logger.error(`Error checking if key ${key} exists: ${err.message}`);
    return false;
  }
}

async del(key: string): Promise<void> {
  try {
    await this.pubClient.del(key);
  } catch (err) {
    this.logger.error(`Error deleting key ${key}: ${err.message}`);
  }
}

async keys(pattern: string): Promise<string[]> {
  try {
    return await this.pubClient.keys(pattern);
  } catch (err) {
    this.logger.error(`Error getting keys with pattern ${pattern}: ${err.message}`);
    return [];
  }
}


async lpush(key: string, value: string): Promise<number> {
  try {
    return await this.pubClient.lPush(key, value);
  } catch (err) {
    this.logger.error(`Error on LPUSH to ${key}: ${err.message}`);
    return 0;
  }
}

async rpop(key: string): Promise<string | null> {
  try {
    return await this.pubClient.rPop(key);
  } catch (err) {
    this.logger.error(`Error on RPOP from ${key}: ${err.message}`);
    return null;
  }
}

async hset(key: string, field: string, value: string): Promise<number> {
  try {
    return await this.pubClient.hSet(key, field, value);
  } catch (err) {
    this.logger.error(`Error on HSET to ${key}.${field}: ${err.message}`);
    return 0;
  }
}

async hget(key: string, field: string): Promise<string | null> {
  try {
    return await this.pubClient.hGet(key, field);
  } catch (err) {
    this.logger.error(`Error on HGET from ${key}.${field}: ${err.message}`);
    return null;
  }
}

async hgetall(key: string): Promise<Record<string, string>> {
  try {
    return await this.pubClient.hGetAll(key);
  } catch (err) {
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


    private async checkConnections() {
    try {
      if (!this.pubClient.isOpen) {
        this.logger.warn('Pub client disconnected, attempting reconnect');
        await this.pubClient.connect();
      }
      
      if (!this.subClient.isOpen) {
        this.logger.warn('Sub client disconnected, attempting reconnect');
        await this.subClient.connect();
        
        // Resubscribe to active channels
        for (const channel of this.activeSubscriptions) {
          const callback = this.subscriptionCallbacks.get(channel);
          if (callback) {
            this.logger.log(`Resubscribing to ${channel} after reconnect`);
            await this.subClient.subscribe(channel, callback);
          }
        }
      }
    } catch (err) {
      this.connectionErrors++;
      this.logger.error(`Health check failed: ${err.message}`);
    }
  }


}
