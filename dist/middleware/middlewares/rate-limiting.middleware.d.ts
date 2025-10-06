import { BaseMiddleware } from '../base.middleware';
import { Socket } from 'socket.io';
export declare class RateLimitingMiddleware extends BaseMiddleware {
    private readonly logger;
    private readonly rateLimits;
    private readonly RATE_LIMIT;
    private readonly RATE_WINDOW;
    execute(context: {
        client: Socket;
        event: string;
        data: any;
    }, next: () => Promise<void>): Promise<void>;
}
