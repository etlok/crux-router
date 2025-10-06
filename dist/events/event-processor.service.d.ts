import { MiddlewareConfigService } from '../middleware/services/middleware-config.service';
import { MiddlewareLoaderService } from '../middleware/middleware-loader.service';
import { RouterService } from 'src/router/router.service';
interface EventAction {
    type: string;
    workflow: string;
    config: Record<string, any>;
}
interface EventPayload {
    event: string;
    config: Record<string, any>;
    middleware: string[];
    actions: EventAction[];
}
export declare class EventProcessorService {
    private readonly middlewareConfig;
    private readonly middlewareLoader;
    private readonly routerService;
    private readonly logger;
    constructor(middlewareConfig: MiddlewareConfigService, middlewareLoader: MiddlewareLoaderService, routerService: RouterService);
    processEvent(eventPayload: EventPayload, sourceContext?: any): Promise<any>;
    private processActions;
    private sanitizeResult;
    private createSafeObject;
}
export {};
