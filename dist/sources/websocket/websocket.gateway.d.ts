import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';
import { EventPayloadDto } from './dto/event-payload.dto';
import { ClientAuthService } from './client-auth.service';
import { EventProcessorService } from 'src/events/event-processor.service';
import { WorkerLogEmitterService } from 'src/events/worker-log-emitter.service';
export declare class WSGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private redisService;
    private routerService;
    private clientAuthService;
    private eventProcessorService;
    private workerLogEmitterService;
    server: Server;
    private redisSubscribed;
    private maxRetries;
    private readonly logger;
    private readonly rateLimiter;
    private readonly RATE_LIMIT;
    private readonly RATE_WINDOW;
    private connectedClients;
    private authenticatedClients;
    constructor(redisService: RedisService, routerService: RouterService, clientAuthService: ClientAuthService, eventProcessorService: EventProcessorService, workerLogEmitterService: WorkerLogEmitterService);
    afterInit(): Promise<void>;
    private subscribeToWorkerResponses;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleAuthenticate(data: {
        token: string;
    }, client: Socket): Promise<{
        status: string;
        message: string;
        code?: undefined;
    } | {
        status: string;
        message: string;
        code: string;
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
            steps: string[];
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
    handleEventWithMiddleware(data: any, client: Socket): Promise<{
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
        data: any;
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
    handlePing(data: any, client: Socket): Promise<{
        pong: boolean;
        timestamp: number;
        clientId: string;
        isAuthenticated: boolean;
        receivedData: any;
    }>;
    getTestToken(): Promise<{
        status: string;
        token: string;
        expiresAt: string;
        payload: any;
        message?: undefined;
    } | {
        status: string;
        message: string;
        token?: undefined;
        expiresAt?: undefined;
        payload?: undefined;
    }>;
    broadcastEvent(event: any): void;
    handleJoinRoom(data: {
        room: string;
    }, client: Socket): {
        status: string;
        room: string;
    };
    joinClientsToChannels(channels: string[], clientIds?: string[]): {
        status: string;
        message: string;
    };
    handleIncomingEvent(event: any): void;
    getConnectedClientsCount(): number;
    getAuthenticatedClientsCount(): number;
}
