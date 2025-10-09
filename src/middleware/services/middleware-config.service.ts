import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { readFile } from 'fs/promises';
import * as path from 'path';
import {
  MiddlewareConfig,
  ClassMiddlewareConfig,
  GroupMiddlewareConfig,
  REDIS_MIDDLEWARE_KEYS,
} from '../interfaces/middleware-config.interface';

/**
 * Service for managing middleware configurations
 */
@Injectable()
export class MiddlewareConfigService implements OnModuleInit {
  private readonly logger = new Logger(MiddlewareConfigService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Initialize middleware configurations on module initialization
   */
  async onModuleInit() {
    try {
      await this.loadConfigFromFileToRedis();
      this.logger.log('Middleware configurations loaded successfully');
    } catch (error) {
      this.logger.error(
        `Failed to load middleware configurations: ${error.message}`,
      );
    }
  }

  /**
   * Load middleware configurations from file and store in Redis
   */
  async loadConfigFromFileToRedis(configPath?: string): Promise<void> {
    // Default path if not provided
    const filePath = configPath || path.join(process.cwd(), 'middleware.json');

    try {
      // Read the configuration file
      const fileContent = await readFile(filePath, 'utf-8');
      const configs: MiddlewareConfig[] = JSON.parse(fileContent);

      // Get Redis client
      const redisClient = await this.redisService.getPubClient();

      // Clear existing configurations
      await redisClient.del(REDIS_MIDDLEWARE_KEYS.CONFIG_LIST);

      // Delete all existing config items
      const existingKeys = await redisClient.keys(
        `${REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX}*`,
      );
      if (existingKeys.length > 0) {
        await redisClient.del(existingKeys);
      }

      // Store each configuration in Redis
      for (const config of configs) {
        // Add to the list of keys
        await redisClient.sAdd(REDIS_MIDDLEWARE_KEYS.CONFIG_LIST, config.key);

        // Store the configuration
        await redisClient.set(
          `${REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX}${config.key}`,
          JSON.stringify(config),
        );
      }

      this.logger.log(
        `Loaded ${configs.length} middleware configurations to Redis`,
      );
    } catch (error) {
      this.logger.error(
        `Error loading middleware configurations: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get all middleware configurations from Redis
   */
  async getAllConfigs(): Promise<MiddlewareConfig[]> {
    try {
      const redisClient = await this.redisService.getPubClient();
      const configs: MiddlewareConfig[] = [];

      // Look for middleware configs using new hash format
      const keysPattern = 'middleware:config:*';
      const keys = await redisClient.keys(keysPattern);

      if (!keys || keys.length === 0) {
        this.logger.warn('No middleware configurations found in Redis');
        return [];
      }

      this.logger.log(
        `Found ${keys.length} middleware configurations in Redis`,
      );

      // Get each configuration from hash
      for (const fullKey of keys) {
        // Extract the middleware key (after the last colon)
        const key = fullKey.split(':').pop() || '';

        try {
          // Get hash fields
          const hash = await redisClient.hGetAll(fullKey);
          if (hash && hash.type) {
            // We need to handle both class and group types
            if (hash.type === 'class') {
              const classConfig: ClassMiddlewareConfig = {
                key: key,
                type: 'class',
                path: hash.path || '',
                config: hash.config ? JSON.parse(hash.config) : {},
              };
              configs.push(classConfig);
            } else if (hash.type === 'group') {
              const groupConfig: GroupMiddlewareConfig = {
                key: key,
                type: 'group',
                keys: hash.keys ? JSON.parse(hash.keys) : [],
              };
              configs.push(groupConfig);
            }
          }
        } catch (error) {
          this.logger.error(
            `Error parsing middleware config for ${key}: ${error.message}`,
          );
        }
      }

      return configs;
    } catch (error) {
      this.logger.error(
        `Error getting middleware configurations: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Get a specific middleware configuration by key
   */
  async getConfigByKey(key: string): Promise<MiddlewareConfig | null> {
    try {
      const redisClient = await this.redisService.getPubClient();
      const configJson = await redisClient.get(
        `${REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX}${key}`,
      );

      return configJson ? JSON.parse(configJson) : null;
    } catch (error) {
      this.logger.error(
        `Error getting middleware configuration for key ${key}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Set active middleware keys
   * @param keys Array of middleware keys to activate
   */
  async setActiveMiddleware(keys: string[]): Promise<void> {
    try {
      const redisClient = await this.redisService.getPubClient();

      // First, delete any existing keys to avoid type conflicts
      await redisClient.del(REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE);
      await redisClient.del('middleware:active'); // Delete legacy key for backward compatibility

      // Store only as JSON string to avoid Redis type conflicts
      await redisClient.set(
        REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE,
        JSON.stringify(keys),
      );

      this.logger.log(`Set active middleware keys: ${keys.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error setting active middleware: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get active middleware keys
   */
  async getActiveMiddleware(): Promise<string[]> {
    try {
      const redisClient = await this.redisService.getPubClient();

      // Get the active middleware from Redis as JSON string
      const activeJson = await redisClient.get(
        REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE,
      );

      // If found, parse and return
      if (activeJson) {
        try {
          const parsed = JSON.parse(activeJson);
          if (Array.isArray(parsed)) {
            this.logger.log(`Found active middleware: ${parsed.join(', ')}`);
            return parsed;
          } else {
            this.logger.warn(
              'Active middleware is not an array, using empty array',
            );
          }
        } catch (jsonError) {
          this.logger.error(
            `Error parsing active middleware JSON: ${jsonError.message}`,
          );
        }
      }

      // If we reach here, we didn't find any valid active middleware
      this.logger.warn('No active middleware found in Redis');
      return [];
    } catch (error) {
      this.logger.error(`Error getting active middleware: ${error.message}`);
      return [];
    }
  }

  /**
   * Resolve middleware keys including expanding groups
   */
  async resolveMiddlewareKeys(keys: string[]): Promise<string[]> {
    const resolved: Set<string> = new Set();
    const visited: Set<string> = new Set();

    // Helper function for recursive resolution
    const resolveKey = async (key: string): Promise<void> => {
      // Prevent infinite recursion
      if (visited.has(key)) {
        return;
      }

      visited.add(key);
      const config = await this.getConfigByKey(key);

      if (!config) {
        // If not found, still add the key (might be a direct class reference)
        resolved.add(key);
        return;
      }

      if (config.type === 'class') {
        resolved.add(key);
      } else if (config.type === 'group') {
        for (const subKey of config.keys) {
          await resolveKey(subKey);
        }
      }
    };

    // Resolve each key
    for (const key of keys) {
      await resolveKey(key);
    }

    return Array.from(resolved);
  }
}
