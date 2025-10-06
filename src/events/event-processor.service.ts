import { Injectable, Logger } from '@nestjs/common';
import { MiddlewareConfigService } from '../middleware/services/middleware-config.service';
import { MiddlewareLoaderService } from '../middleware/middleware-loader.service';
import { RouterService } from 'src/router/router.service';

interface EventAction {
  type: string;
  workflow: string; // Changed from optional to required
  config: Record<string, any>;
}

interface EventPayload {
  event: string;
  config: Record<string, any>;
  middleware: string[];
  actions: EventAction[];
}

/**
 * Service for processing events and executing middleware based on event configuration
 */
@Injectable()
export class EventProcessorService {
  private readonly logger = new Logger(EventProcessorService.name);

  constructor(
    private readonly middlewareConfig: MiddlewareConfigService,
    private readonly middlewareLoader: MiddlewareLoaderService,
    private readonly routerService: RouterService
  ) {}


  async processEvent(eventPayload: EventPayload, sourceContext: any = {}): Promise<any> {
    this.logger.log(`Processing event: ${eventPayload.event}`);
    
    try {
      // Create the context for middleware execution - ensuring no circular references
      const context = {
        event: eventPayload.event,
        eventConfig: eventPayload.config,
        sourceContext, // This should now be safe since we've removed the Socket object
        data: eventPayload,
        result: null as any, 
        metadata: {
          startTime: Date.now(),
          middlewareResults: {},
        }
      };

      // to temporarily set active middleware to those specified in the event
      await this.middlewareConfig.setActiveMiddleware(eventPayload.middleware);

      // to execute middleware chain
      await this.middlewareLoader.executeMiddlewareChain(context);

      this.logger.log('Middleware execution successful!')
      // to process actions if middleware succeeds
      if (eventPayload.actions && eventPayload.actions.length > 0) {
        context.result = await this.processActions(eventPayload.actions, context);
      }

      this.logger.log(`Completed processing event: ${eventPayload.event}`);
      
      // Sanitize result to remove any potential circular references before returning
      return this.sanitizeResult(context.result);
    } catch (error) {
      this.logger.error(`Error processing event ${eventPayload.event}: ${error.message}`);
      throw error;
    }
  }


  private async processActions(actions: EventAction[], context: any): Promise<any[]> {
    const results: any[] = [];

    for (const action of actions) {
      try {
        this.logger.log(`Executing action: ${action.type}`);
        
              const result = await this.routerService.routeEvent(action.workflow);

              results.push(result);

      } catch (error) {
        this.logger.error(`Error executing action ${action.type}: ${error.message}`);
        throw error; 
      }
    }

    return results;
  }

  /**
   * Sanitize the result to remove any circular references
   * This prevents JSON.stringify errors when returning the result
   */
  private sanitizeResult(result: any): any {
    if (!result) return result;
    
    try {
      // Use this approach to catch circular references
      const seen = new WeakSet();
      return JSON.parse(JSON.stringify(result, (key, value) => {
        // Skip functions and undefined values
        if (typeof value === 'function' || typeof value === 'undefined') {
          return undefined;
        }
        
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      }));
    } catch (error) {
      this.logger.error(`Error sanitizing result: ${error.message}`);
      // Return a safe version without detailed data if we encounter an error
      if (Array.isArray(result)) {
        return result.map(item => this.createSafeObject(item));
      } else {
        return this.createSafeObject(result);
      }
    }
  }
  
  /**
   * Create a safe object with only primitive types
   */
  private createSafeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const safeObj: Record<string, any> = {};
    
    // Extract only primitive values and simple objects
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value === null || value === undefined) {
          safeObj[key] = value;
        } else if (typeof value !== 'object' && typeof value !== 'function') {
          safeObj[key] = value;
        } else if (typeof value === 'object') {
          if (Array.isArray(value)) {
            safeObj[key] = '[Array]';
          } else {
            safeObj[key] = '[Object]';
          }
        }
      }
    }
    
    return safeObj;
  }
}
