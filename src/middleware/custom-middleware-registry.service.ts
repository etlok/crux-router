/**
 * Custom Middleware Registry
 *
 * This service allows for the dynamic registration and management of
 * customer-provided middleware in the Crux system.
 */

import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CustomMiddlewareRegistry {
  private readonly logger = new Logger(CustomMiddlewareRegistry.name);
  private middlewareDir = path.join(process.cwd(), 'custom-middleware');

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {
    // Ensure the middleware directory exists
    this.ensureMiddlewareDir();
  }

  private async ensureMiddlewareDir(): Promise<void> {
    try {
      await fs.mkdir(this.middlewareDir, { recursive: true });
    } catch (error) {
      this.logger.error(
        `Error creating middleware directory: ${error.message}`,
      );
    }
  }

  /**
   * Register a new custom middleware
   *
   * @param key - The key to identify the middleware
   * @param code - The JavaScript/TypeScript code for the middleware
   * @param config - Additional configuration for the middleware
   * @param metadata - Metadata about the middleware (author, description, etc.)
   */
  async registerMiddleware(
    key: string,
    code: string,
    config: Record<string, any> = {},
    metadata: Record<string, any> = {},
  ): Promise<string> {
    // Validate the key (no spaces, only lowercase alphanumeric and dashes)
    if (!/^[a-z0-9-]+$/.test(key)) {
      throw new Error(
        'Invalid middleware key: must be lowercase alphanumeric with dashes only',
      );
    }

    // Check if middleware with this key already exists
    const exists = await this.redis.exists(`middleware:${key}`);
    if (exists) {
      throw new Error(`Middleware with key '${key}' already exists`);
    }

    // Generate a unique ID for this middleware
    const middlewareId = `middleware-${uuidv4()}`;

    try {
      // Save the middleware code to a file
      const filename = `${key}-${Date.now()}.js`;
      const filePath = path.join(this.middlewareDir, filename);

      await fs.writeFile(filePath, code, 'utf8');

      // Save the middleware configuration to Redis
      const middlewareConfig = {
        id: middlewareId,
        key,
        type: 'custom',
        path: filePath,
        config,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      await this.redis.set(
        `middleware:${key}`,
        JSON.stringify(middlewareConfig),
      );

      // Add this middleware key to the available middleware list
      await this.redis.sadd('middleware:available', key);

      this.logger.log(`Registered custom middleware: ${key} (${middlewareId})`);

      return middlewareId;
    } catch (error) {
      this.logger.error(
        `Error registering middleware '${key}': ${error.message}`,
      );
      throw new Error(`Failed to register middleware: ${error.message}`);
    }
  }

  /**
   * Update an existing custom middleware
   */
  async updateMiddleware(
    key: string,
    code?: string,
    config?: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // Check if middleware exists
    const configStr = await this.redis.get(`middleware:${key}`);
    if (!configStr) {
      throw new Error(`Middleware '${key}' not found`);
    }

    try {
      const middlewareConfig = JSON.parse(configStr);

      // Update code if provided
      if (code) {
        const filename = `${key}-${Date.now()}.js`;
        const filePath = path.join(this.middlewareDir, filename);

        await fs.writeFile(filePath, code, 'utf8');
        middlewareConfig.path = filePath;
      }

      // Update config if provided
      if (config) {
        middlewareConfig.config = {
          ...middlewareConfig.config,
          ...config,
        };
      }

      // Update metadata if provided
      if (metadata) {
        middlewareConfig.metadata = {
          ...middlewareConfig.metadata,
          ...metadata,
          updatedAt: new Date().toISOString(),
        };
      }

      // Save updated config
      await this.redis.set(
        `middleware:${key}`,
        JSON.stringify(middlewareConfig),
      );

      this.logger.log(`Updated custom middleware: ${key}`);
    } catch (error) {
      this.logger.error(`Error updating middleware '${key}': ${error.message}`);
      throw new Error(`Failed to update middleware: ${error.message}`);
    }
  }

  /**
   * Delete a custom middleware
   */
  async deleteMiddleware(key: string): Promise<void> {
    // Check if middleware exists
    const configStr = await this.redis.get(`middleware:${key}`);
    if (!configStr) {
      throw new Error(`Middleware '${key}' not found`);
    }

    try {
      const middlewareConfig = JSON.parse(configStr);

      // Delete the middleware file if it exists
      if (middlewareConfig.path) {
        try {
          await fs.unlink(middlewareConfig.path);
        } catch (err) {
          // File may not exist, just log and continue
          this.logger.warn(
            `Could not delete middleware file ${middlewareConfig.path}: ${err.message}`,
          );
        }
      }

      // Remove from Redis
      await this.redis.del(`middleware:${key}`);
      await this.redis.srem('middleware:available', key);

      this.logger.log(`Deleted custom middleware: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting middleware '${key}': ${error.message}`);
      throw new Error(`Failed to delete middleware: ${error.message}`);
    }
  }

  /**
   * Get all registered middleware
   */
  async getAllMiddleware(): Promise<Record<string, any>[]> {
    const keys = await this.redis.smembers('middleware:available');
    const result: Record<string, any>[] = [];

    for (const key of keys) {
      const configStr = await this.redis.get(`middleware:${key}`);
      if (configStr) {
        try {
          const config = JSON.parse(configStr);
          result.push(config);
        } catch (err) {
          this.logger.warn(
            `Error parsing middleware config for '${key}': ${err.message}`,
          );
        }
      }
    }

    return result;
  }

  /**
   * Get a specific middleware by key
   */
  async getMiddleware(key: string): Promise<Record<string, any> | null> {
    const configStr = await this.redis.get(`middleware:${key}`);
    if (!configStr) {
      return null;
    }

    try {
      return JSON.parse(configStr);
    } catch (err) {
      this.logger.warn(
        `Error parsing middleware config for '${key}': ${err.message}`,
      );
      return null;
    }
  }
}
