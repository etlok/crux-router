import { Server, Socket } from 'socket.io';
import { MiddlewareLoaderService } from './middleware-loader.service';
export declare class MiddlewareTestGateway {
    private readonly middlewareLoaderService;
    server: Server;
    private readonly logger;
    constructor(middlewareLoaderService: MiddlewareLoaderService);
    onModuleInit(): Promise<void>;
    handleAuthTest(client: Socket, payload: any): Promise<any>;
    handleLoggingTest(client: Socket, payload: any): Promise<any>;
    handleValidationTest(client: Socket, payload: any): Promise<any>;
    handleErrorTest(client: Socket, payload: any): Promise<any>;
    handleRateLimitTest(client: Socket, payload: any): Promise<any>;
    handleCustomEvent(client: Socket, payload: any): Promise<any>;
}
