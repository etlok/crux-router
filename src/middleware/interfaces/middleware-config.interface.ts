/**
 * Base interface for middleware configuration entries
 */
export interface BaseMiddlewareConfig {
  key: string;
  type: 'class' | 'group';
}

/**
 * Configuration for class-based middleware
 */
export interface ClassMiddlewareConfig extends BaseMiddlewareConfig {
  type: 'class';
  path: string;
  config?: Record<string, any>;
}

/**
 * Configuration for group-based middleware (collection of other middleware)
 */
export interface GroupMiddlewareConfig extends BaseMiddlewareConfig {
  type: 'group';
  keys: string[];
}

/**
 * Union type for all middleware configurations
 */
export type MiddlewareConfig = ClassMiddlewareConfig | GroupMiddlewareConfig;

/**
 * Redis keys for middleware
 */
export const REDIS_MIDDLEWARE_KEYS = {
  CONFIG_LIST: 'middleware:config:list',
  CONFIG_ITEM_PREFIX: 'middleware:config:item:',
  ACTIVE_MIDDLEWARE: 'middleware:config:active',
};
