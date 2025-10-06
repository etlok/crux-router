export interface BaseMiddlewareConfig {
    key: string;
    type: 'class' | 'group';
}
export interface ClassMiddlewareConfig extends BaseMiddlewareConfig {
    type: 'class';
    path: string;
    config?: Record<string, any>;
}
export interface GroupMiddlewareConfig extends BaseMiddlewareConfig {
    type: 'group';
    keys: string[];
}
export type MiddlewareConfig = ClassMiddlewareConfig | GroupMiddlewareConfig;
export declare const REDIS_MIDDLEWARE_KEYS: {
    CONFIG_LIST: string;
    CONFIG_ITEM_PREFIX: string;
    ACTIVE_MIDDLEWARE: string;
};
