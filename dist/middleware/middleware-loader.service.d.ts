import { ModuleRef } from '@nestjs/core';
import { MiddlewareConfigService } from './services/middleware-config.service';
export interface MiddlewareFunction {
    execute(context: any, next: () => Promise<void>): Promise<void>;
}
export interface MiddlewareDefinition {
    name: string;
    priority: number;
    enabled: boolean;
    middlewareInstance: MiddlewareFunction;
}
export declare class MiddlewareLoaderService {
    private moduleRef;
    private middlewareConfigService;
    private readonly logger;
    private middlewares;
    private initialized;
    constructor(moduleRef: ModuleRef, middlewareConfigService: MiddlewareConfigService);
    registerMiddleware(key: string, middlewareInstance: MiddlewareFunction, priority?: number): void;
    private registerFallbackMiddleware;
    initializeMiddleware(middlewarePath?: string): Promise<void>;
    private resolveMiddlewareKeys;
    executeMiddlewareChain(context: any): Promise<void>;
    private executeDefaultMiddlewareChain;
    getMiddlewares(): MiddlewareDefinition[];
    setMiddlewareState(name: string, enabled: boolean): boolean;
}
