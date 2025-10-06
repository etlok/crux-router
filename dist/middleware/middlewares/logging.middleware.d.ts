import { BaseMiddleware } from '../base.middleware';
export declare class LoggingMiddleware extends BaseMiddleware {
    private readonly logger;
    execute(context: {
        client: any;
        event: string;
        data: any;
    }, next: () => Promise<void>): Promise<void>;
}
