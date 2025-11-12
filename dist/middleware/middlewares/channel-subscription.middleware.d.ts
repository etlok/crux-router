import { BaseMiddleware } from '../base.middleware';
export declare class ChannelSubscriptionMiddleware extends BaseMiddleware {
    private readonly logger;
    execute(context: any, next: () => Promise<void>): Promise<void>;
}
