import 'reflect-metadata';

/**
 * Base class for middleware
 */
export abstract class BaseMiddleware {
  /**
   * Execute the middleware
   * @param context The context to use
   * @param next Function to call the next middleware in the chain
   */
  abstract execute(context: any, next: () => Promise<void>): Promise<void>;
}

/**
 * Middleware decorator for setting priority
 * Lower priority values execute first
 */
export function Middleware(options: { priority?: number, enabled?: boolean } = {}): ClassDecorator {
  return (target: any) => {
    const { priority = 100, enabled = true } = options;
    
    Reflect.defineMetadata('middleware:priority', priority, target);
    Reflect.defineMetadata('middleware:enabled', enabled, target);
    
    return target;
  };
}
