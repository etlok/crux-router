import { MiddlewareVisualizerService } from './middleware-visualizer.service';
import { MiddlewareLoaderService } from './middleware-loader.service';
import { MiddlewareConfigService } from './services/middleware-config.service';
export declare class MiddlewareController {
    private readonly middlewareVisualizer;
    private readonly middlewareLoader;
    private readonly middlewareConfig;
    private readonly logger;
    constructor(middlewareVisualizer: MiddlewareVisualizerService, middlewareLoader: MiddlewareLoaderService, middlewareConfig: MiddlewareConfigService);
    getMiddlewares(): Promise<{
        name: string;
        priority: number;
        enabled: boolean;
    }[]>;
    visualize(): Promise<{
        visualization: string;
        statistics: Record<string, any>;
    }>;
    toggleMiddleware(name: string, state: 'enable' | 'disable'): Promise<{
        success: boolean;
        message: string;
    }>;
    getConfigs(): Promise<{
        success: boolean;
        configs: import("./interfaces/middleware-config.interface").MiddlewareConfig[];
    }>;
    getActiveMiddleware(): Promise<{
        success: boolean;
        active: string[];
    }>;
    setActiveMiddleware(body: {
        keys: string[];
    }): Promise<{
        success: boolean;
        message: any;
    }>;
    reloadMiddlewareConfig(): Promise<{
        success: boolean;
        message: any;
    }>;
}
