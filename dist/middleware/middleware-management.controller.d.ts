import { CustomMiddlewareRegistry } from './custom-middleware-registry.service';
import { DynamicMiddlewareLoader } from './dynamic-middleware-loader.service';
import { MiddlewareLoaderService } from './middleware-loader.service';
import { MiddlewareConfigService } from './services/middleware-config.service';
declare class RegisterMiddlewareDto {
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
declare class UpdateMiddlewareDto {
    code?: string;
    config?: Record<string, any>;
    metadata?: Record<string, any>;
}
export declare class MiddlewareManagementController {
    private customMiddlewareRegistry;
    private dynamicMiddlewareLoader;
    private middlewareLoaderService;
    private middlewareConfigService;
    constructor(customMiddlewareRegistry: CustomMiddlewareRegistry, dynamicMiddlewareLoader: DynamicMiddlewareLoader, middlewareLoaderService: MiddlewareLoaderService, middlewareConfigService: MiddlewareConfigService);
    getAllMiddleware(): Promise<Record<string, any>[]>;
    getMiddleware(key: string): Promise<Record<string, any>>;
    registerMiddleware(dto: RegisterMiddlewareDto): Promise<{
        id: string;
        key: string;
        message: string;
        error?: undefined;
    } | {
        error: any;
        id?: undefined;
        key?: undefined;
        message?: undefined;
    }>;
    updateMiddleware(key: string, dto: UpdateMiddlewareDto): Promise<{
        message: string;
        error?: undefined;
    } | {
        error: any;
        message?: undefined;
    }>;
    deleteMiddleware(key: string): Promise<{
        message: string;
        error?: undefined;
    } | {
        error: any;
        message?: undefined;
    }>;
    testMiddleware(key: string, testContext: any): Promise<{
        error: string;
        message?: undefined;
        nextCalled?: undefined;
        resultingContext?: undefined;
        stack?: undefined;
    } | {
        message: string;
        nextCalled: boolean;
        resultingContext: any;
        error?: undefined;
        stack?: undefined;
    } | {
        error: string;
        stack: any;
        message?: undefined;
        nextCalled?: undefined;
        resultingContext?: undefined;
    }>;
    testMiddlewareChain(body: {
        middlewareKeys: string[];
        context: any;
    }): Promise<{
        message: string;
        middlewareKeys: string[];
        resultingContext: any;
        error?: undefined;
        stack?: undefined;
    } | {
        error: string;
        stack: any;
        message?: undefined;
        middlewareKeys?: undefined;
        resultingContext?: undefined;
    }>;
}
export {};
