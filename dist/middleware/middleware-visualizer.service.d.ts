import { MiddlewareLoaderService } from './middleware-loader.service';
export declare class MiddlewareVisualizerService {
    private readonly middlewareLoader;
    private readonly logger;
    constructor(middlewareLoader: MiddlewareLoaderService);
    visualizeMiddlewareChain(): string;
    logMiddlewareChain(): void;
    getMiddlewareStatistics(): Record<string, any>;
    private countByPriority;
    private calculateAveragePriority;
}
