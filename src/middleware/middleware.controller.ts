import { Controller, Get, Post, Body, Logger, Param } from '@nestjs/common';
import { MiddlewareVisualizerService } from './middleware-visualizer.service';
import { MiddlewareLoaderService } from './middleware-loader.service';
import { MiddlewareConfigService } from './services/middleware-config.service';

/**
 * Controller for middleware management endpoints
 */
@Controller('middleware')
export class MiddlewareController {
  private readonly logger = new Logger(MiddlewareController.name);
  
  constructor(
    private readonly middlewareVisualizer: MiddlewareVisualizerService,
    private readonly middlewareLoader: MiddlewareLoaderService,
    private readonly middlewareConfig: MiddlewareConfigService,
  ) {}
  
  /**
   * Get a list of all registered middleware
   */
  @Get()
  async getMiddlewares() {
    return this.middlewareLoader.getMiddlewares().map(middleware => ({
      name: middleware.name,
      priority: middleware.priority,
      enabled: middleware.enabled
    }));
  }
  
  /**
   * Get a visualization of the middleware chain
   */
  @Get('visualization')
  async visualize() {
    return {
      visualization: this.middlewareVisualizer.visualizeMiddlewareChain(),
      statistics: this.middlewareVisualizer.getMiddlewareStatistics()
    };
  }
  
  /**
   * Enable or disable a middleware by name
   */
  @Get('toggle/:name/:state')
  async toggleMiddleware(@Param('name') name: string, @Param('state') state: 'enable' | 'disable') {
    const enabled = state === 'enable';
    const success = this.middlewareLoader.setMiddlewareState(name, enabled);
    
    return {
      success,
      message: success
        ? `Middleware ${name} ${enabled ? 'enabled' : 'disabled'} successfully`
        : `Middleware ${name} not found`
    };
  }

  /**
   * Get all middleware configurations from Redis
   */
  @Get('config')
  async getConfigs() {
    const configs = await this.middlewareConfig.getAllConfigs();
    return {
      success: true,
      configs
    };
  }

  /**
   * Get active middleware keys
   */
  @Get('active')
  async getActiveMiddleware() {
    const active = await this.middlewareConfig.getActiveMiddleware();
    return {
      success: true,
      active
    };
  }

  /**
   * Set active middleware keys
   */
  @Post('active')
  async setActiveMiddleware(@Body() body: { keys: string[] }) {
    try {
      await this.middlewareConfig.setActiveMiddleware(body.keys);
      return {
        success: true,
        message: `Set ${body.keys.length} active middleware keys`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Reload middleware configuration from file to Redis
   */
  @Post('reload')
  async reloadMiddlewareConfig() {
    try {
      await this.middlewareConfig.loadConfigFromFileToRedis();
      return {
        success: true,
        message: 'Middleware configurations reloaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
