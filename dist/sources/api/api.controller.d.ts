import { RedisService } from 'src/redis/redis.service';
import { WSGateway } from '../websocket/websocket.gateway';
import { RouterService } from 'src/router/router.service';
export declare class ApiController {
    private redisService;
    private webSocketGateway;
    private routerService;
    constructor(redisService: RedisService, webSocketGateway: WSGateway, routerService: RouterService);
    handleIncoming(data: any): Promise<{
        status: string;
    }>;
    notifyClient(data: any): Promise<{
        status: string;
    }>;
    handleIncomingWebsocketEvent(data: any): Promise<void>;
    handleIncomingAPIEvent(data: any): Promise<void>;
}
