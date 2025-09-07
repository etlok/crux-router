import { RouterService } from './router.service';
export declare class RouterController {
    private readonly routerService;
    constructor(routerService: RouterService);
    routeEvent(body: {
        event: string;
        payload: any;
    }): Promise<{
        status: string;
        workflow_instance_id: string;
        request_id: string;
    }>;
}
