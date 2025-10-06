import { BaseMiddleware } from '../base.middleware';
import { Socket } from 'socket.io';
interface WebSocketContext {
    client: Socket;
    event: string;
    data: any;
    metadata: Record<string, any>;
    timestamp: number;
}
export declare class ErrorHandlingMiddleware extends BaseMiddleware {
    private readonly logger;
    execute(context: WebSocketContext, next: () => Promise<void>): Promise<void>;
    private generateRequestId;
}
export {};
