import { ModuleRef } from '@nestjs/core';
import { MiddlewareConfigService } from './services/middleware-config.service';
import { CustomMiddlewareRegistry } from './custom-middleware-registry.service';
import { MiddlewareFunction, MiddlewareDefinition } from './middleware-loader.service';
export declare class DynamicMiddlewareLoader {
    private moduleRef;
    private middlewareConfigService;
    private customMiddlewareRegistry;
    private readonly logger;
    private sandboxCache;
    constructor(moduleRef: ModuleRef, middlewareConfigService: MiddlewareConfigService, customMiddlewareRegistry: CustomMiddlewareRegistry);
    loadCustomMiddleware(key: string): Promise<MiddlewareFunction | null>;
    private createSandbox;
    private createMiddlewareInstance;
    loadAllCustomMiddleware(): Promise<Map<string, MiddlewareDefinition>>;
    clearCache(key?: string): void;
}
