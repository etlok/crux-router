/**
 * Dynamic Middleware Loader
 *
 * This service enhances the core MiddlewareLoaderService by adding support
 * for loading customer-defined middleware dynamically at runtime.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import * as vm from 'vm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MiddlewareConfigService } from './services/middleware-config.service';
import { CustomMiddlewareRegistry } from './custom-middleware-registry.service';
import {
  MiddlewareFunction,
  MiddlewareDefinition,
} from './middleware-loader.service';

@Injectable()
export class DynamicMiddlewareLoader {
  private readonly logger = new Logger(DynamicMiddlewareLoader.name);
  private sandboxCache = new Map<string, MiddlewareFunction>();

  constructor(
    private moduleRef: ModuleRef,
    private middlewareConfigService: MiddlewareConfigService,
    private customMiddlewareRegistry: CustomMiddlewareRegistry,
  ) {}

  /**
   * Load a custom middleware from its configuration
   */
  async loadCustomMiddleware(key: string): Promise<MiddlewareFunction | null> {
    try {
      // Check if we've already loaded and cached this middleware
      if (this.sandboxCache.has(key)) {
        this.logger.log(`Using cached middleware for '${key}'`);
        return this.sandboxCache.get(key) as MiddlewareFunction;
      }

      // Get middleware config
      const middlewareConfig =
        await this.customMiddlewareRegistry.getMiddleware(key);
      if (!middlewareConfig) {
        this.logger.warn(`Middleware '${key}' not found`);
        return null;
      }

      // Check if file path exists
      if (!middlewareConfig.path) {
        this.logger.warn(`No file path for middleware '${key}'`);
        return null;
      }

      // Read the middleware code
      const code = await fs.readFile(middlewareConfig.path, 'utf8');

      // Create a sandbox context for executing the middleware
      const sandbox = this.createSandbox(key, middlewareConfig.config);

      // Create middleware instance
      const middlewareInstance = await this.createMiddlewareInstance(
        key,
        code,
        sandbox,
      );

      if (middlewareInstance) {
        // Cache the middleware instance
        this.sandboxCache.set(key, middlewareInstance);
        return middlewareInstance;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error loading custom middleware '${key}': ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Create a sandbox environment for executing custom middleware
   */
  private createSandbox(key: string, config: Record<string, any> = {}) {
    // Create a restricted context for the middleware to run in
    const console = {
      log: (...args: any[]) => this.logger.log(`[${key}] ${args.join(' ')}`),
      warn: (...args: any[]) => this.logger.warn(`[${key}] ${args.join(' ')}`),
      error: (...args: any[]) =>
        this.logger.error(`[${key}] ${args.join(' ')}`),
    };

    // Create sandbox with limited access to system
    const sandbox = {
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Date,
      Buffer,
      JSON,
      Math,
      Object,
      Array,
      String,
      Number,
      Boolean,
      Map,
      Set,
      Promise,
      Error,
      config, // Pass the middleware config into the sandbox
      module: { exports: {} },
      exports: {},
      require: (moduleName: string) => {
        // Very restricted require - only allow certain safe modules
        if (['uuid', 'crypto', 'lodash', 'jsonwebtoken'].includes(moduleName)) {
          return require(moduleName);
        }
        throw new Error(
          `Module '${moduleName}' is not allowed in custom middleware`,
        );
      },
    };

    return sandbox;
  }

  /**
   * Create a middleware instance from code
   */
  private async createMiddlewareInstance(
    key: string,
    code: string,
    sandbox: Record<string, any>,
  ): Promise<MiddlewareFunction | null> {
    try {
      // Execute the middleware code in the sandbox
      const script = new vm.Script(code, { filename: key });
      const context = vm.createContext(sandbox);
      script.runInContext(context, { timeout: 5000 });

      // Check if the middleware exports a valid execute function
      const moduleExports = sandbox.module.exports;

      // Check for CommonJS module.exports
      if (
        typeof moduleExports === 'object' &&
        typeof moduleExports.execute === 'function'
      ) {
        return moduleExports as MiddlewareFunction;
      }

      // Check for ES module export
      if (
        typeof sandbox.exports === 'object' &&
        typeof sandbox.exports.execute === 'function'
      ) {
        return sandbox.exports as MiddlewareFunction;
      }

      // Check if the module exports a class with an execute method
      if (typeof moduleExports === 'function') {
        try {
          const instance = new moduleExports();
          if (typeof instance.execute === 'function') {
            return instance as MiddlewareFunction;
          }
        } catch (e) {
          this.logger.warn(
            `Failed to instantiate middleware class for '${key}': ${e.message}`,
          );
        }
      }

      this.logger.warn(
        `Middleware '${key}' does not export a valid execute function`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Error creating middleware instance for '${key}': ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Load all available custom middleware
   */
  async loadAllCustomMiddleware(): Promise<Map<string, MiddlewareDefinition>> {
    const result = new Map<string, MiddlewareDefinition>();

    try {
      const allMiddleware =
        await this.customMiddlewareRegistry.getAllMiddleware();

      for (const config of allMiddleware) {
        const { key } = config;
        const instance = await this.loadCustomMiddleware(key);

        if (instance) {
          // Determine priority (default to 100)
          const priority = config.config?.priority || 100;

          result.set(key, {
            name: key,
            priority,
            enabled: true,
            middlewareInstance: instance,
          });

          this.logger.log(
            `Loaded custom middleware: ${key} (priority: ${priority})`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error loading custom middleware: ${error.message}`);
    }

    return result;
  }

  /**
   * Clear the middleware cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.sandboxCache.delete(key);
      this.logger.log(`Cleared cache for middleware '${key}'`);
    } else {
      this.sandboxCache.clear();
      this.logger.log('Cleared entire middleware cache');
    }
  }
}
