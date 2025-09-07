import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';
import { EventPayloadDto } from './dto/event-payload.dto';
import { ClientAuthService } from './client-auth.service';
export declare class WSGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private redisService;
    private routerService;
    private clientAuthService;
    server: Server;
    private redisSubscribed;
    private maxRetries;
    private readonly logger;
    private readonly rateLimiter;
    private readonly RATE_LIMIT;
    private readonly RATE_WINDOW;
    private connectedClients;
    private authenticatedClients;
    constructor(redisService: RedisService, routerService: RouterService, clientAuthService: ClientAuthService);
    afterInit(): Promise<void>;
    private subscribeToWorkerResponses;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleAuthenticate(data: {
        token: string;
    }, client: Socket): Promise<{
        status: string;
        message: string;
        user?: undefined;
        code?: undefined;
    } | {
        status: string;
        message: string;
        user: {
            id: any;
            roles: any;
            name: any;
        };
        code?: undefined;
    } | {
        status: string;
        message: string;
        code: string;
        user?: undefined;
    }>;
    handleEvent(data: EventPayloadDto, client: Socket): Promise<{
        status: string;
        message: string;
        requestId?: undefined;
        timestamp?: undefined;
        data?: undefined;
        code?: undefined;
    } | {
        status: string;
        requestId: string;
        timestamp: string;
        data: {
            status: string;
            workflow_instance_id: string;
            request_id: string;
        };
        message?: undefined;
        code?: undefined;
    } | {
        status: string;
        code: any;
        message: any;
        timestamp: string;
        requestId?: undefined;
        data?: undefined;
    }>;
    broadcastEvent(event: any): void;
    handleJoinRoom(data: {
        room: string;
    }, client: Socket): {
        status: string;
        room: string;
    };
    handleIncomingEvent(event: any): void;
    getConnectedClientsCount(): number;
    getAuthenticatedClientsCount(): number;
}
