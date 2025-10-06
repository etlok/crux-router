import { BaseMiddleware } from '../base.middleware';
import { Socket } from 'socket.io';
interface WebSocketContext {
    client: Socket;
    event: string;
    data: any;
    metadata: Record<string, any>;
}
export declare class ValidationMiddleware extends BaseMiddleware {
    private readonly logger;
    private readonly schemas;
    execute(context: WebSocketContext, next: () => Promise<void>): Promise<void>;
}
export {};
