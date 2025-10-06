/**
 * Middleware Management Controller
 * 
 * Provides API endpoints for customers to register, update, and manage their custom middleware.
 */

import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CustomMiddlewareRegistry } from './custom-middleware-registry.service';
import { DynamicMiddlewareLoader } from './dynamic-middleware-loader.service';
import { MiddlewareLoaderService } from './middleware-loader.service';
import { MiddlewareConfigService } from './services/middleware-config.service';
import { AuthGuard } from './auth.guard';

// Define DTOs for request validation
class RegisterMiddlewareDto {
  key: string;
  code: string;
  config?: Record<string, any>;
  metadata?: {
    name?: string;
    description?: string;
    author?: string;
    [key: string]: any;
  };
}

class UpdateMiddlewareDto {
  code?: string;
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

// In a real app, you would want to use a proper authentication and authorization system
// This is a placeholder for demonstration purposes
const tenantAuthGuard = { canActivate: () => true };

@Controller('api/middleware')
export class MiddlewareManagementController {
  constructor(
    private customMiddlewareRegistry: CustomMiddlewareRegistry,
    private dynamicMiddlewareLoader: DynamicMiddlewareLoader,
    private middlewareLoaderService: MiddlewareLoaderService,
    private middlewareConfigService: MiddlewareConfigService
  ) {}
  
  @Get()
  @UseGuards(tenantAuthGuard)
  async getAllMiddleware() {
    return this.customMiddlewareRegistry.getAllMiddleware();
  }
  
  @Get(':key')
  @UseGuards(tenantAuthGuard)
  async getMiddleware(@Param('key') key: string) {
    const middleware = await this.customMiddlewareRegistry.getMiddleware(key);
    if (!middleware) {
      return { error: `Middleware '${key}' not found` };
    }
    return middleware;
  }
  
  @Post()
  @UseGuards(tenantAuthGuard)
  async registerMiddleware(@Body() dto: RegisterMiddlewareDto) {
    try {
      // Register the middleware in the registry
      const id = await this.customMiddlewareRegistry.registerMiddleware(
        dto.key,
        dto.code,
        dto.config || {},
        dto.metadata || {}
      );
      
      // Load the middleware to validate it
      const middleware = await this.dynamicMiddlewareLoader.loadCustomMiddleware(dto.key);
      if (!middleware) {
        // If loading fails, delete the registered middleware
        await this.customMiddlewareRegistry.deleteMiddleware(dto.key);
        return { error: `Failed to load middleware '${dto.key}'` };
      }
      
      // Clear cache to ensure fresh middleware is loaded next time
      this.dynamicMiddlewareLoader.clearCache(dto.key);
      
      return { 
        id, 
        key: dto.key, 
        message: `Middleware '${dto.key}' registered successfully` 
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  @Put(':key')
  @UseGuards(tenantAuthGuard)
  async updateMiddleware(@Param('key') key: string, @Body() dto: UpdateMiddlewareDto) {
    try {
      await this.customMiddlewareRegistry.updateMiddleware(
        key,
        dto.code,
        dto.config,
        dto.metadata
      );
      
      // Clear cache to ensure fresh middleware is loaded next time
      this.dynamicMiddlewareLoader.clearCache(key);
      
      return { message: `Middleware '${key}' updated successfully` };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  @Delete(':key')
  @UseGuards(tenantAuthGuard)
  async deleteMiddleware(@Param('key') key: string) {
    try {
      await this.customMiddlewareRegistry.deleteMiddleware(key);
      
      // Clear cache
      this.dynamicMiddlewareLoader.clearCache(key);
      
      return { message: `Middleware '${key}' deleted successfully` };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  @Post(':key/test')
  @UseGuards(tenantAuthGuard)
  async testMiddleware(@Param('key') key: string, @Body() testContext: any) {
    try {
      // Clear cache to ensure we test the latest version
      this.dynamicMiddlewareLoader.clearCache(key);
      
      // Load the middleware
      const middleware = await this.dynamicMiddlewareLoader.loadCustomMiddleware(key);
      if (!middleware) {
        return { error: `Middleware '${key}' not found or invalid` };
      }
      
      // Create a test context
      const context = testContext || {
        event: 'test_event',
        sourceContext: {
          isAuthenticated: true,
          userId: 'test-user',
          userInfo: { name: 'Test User' }
        },
        metadata: {
          middlewareResults: {}
        }
      };
      
      // Execute the middleware
      let nextCalled = false;
      const next = async () => {
        nextCalled = true;
        return Promise.resolve();
      };
      
      await middleware.execute(context, next);
      
      return {
        message: `Middleware '${key}' executed successfully`,
        nextCalled,
        resultingContext: context
      };
    } catch (error) {
      return { 
        error: `Error testing middleware '${key}': ${error.message}`,
        stack: error.stack
      };
    }
  }
  
  @Post('chain/test')
  @UseGuards(tenantAuthGuard)
  async testMiddlewareChain(@Body() body: { middlewareKeys: string[], context: any }) {
    try {
      const { middlewareKeys, context: initialContext } = body;
      
      // Set the active middleware chain temporarily
      await this.middlewareConfigService.setActiveMiddleware(middlewareKeys);
      
      // Create a test context
      const context = initialContext || {
        event: 'test_event',
        sourceContext: {
          isAuthenticated: true,
          userId: 'test-user',
          userInfo: { name: 'Test User' }
        },
        metadata: {
          startTime: Date.now(),
          middlewareResults: {},
        }
      };
      
      // Execute the middleware chain
      await this.middlewareLoaderService.executeMiddlewareChain(context);
      
      // Add execution time to response
      if (context.metadata) {
        context.metadata.endTime = Date.now();
        context.metadata.duration = context.metadata.endTime - context.metadata.startTime;
      }
      
      return {
        message: `Middleware chain executed successfully`,
        middlewareKeys,
        resultingContext: context
      };
    } catch (error) {
      return { 
        error: `Error testing middleware chain: ${error.message}`,
        stack: error.stack
      };
    }
  }
}
