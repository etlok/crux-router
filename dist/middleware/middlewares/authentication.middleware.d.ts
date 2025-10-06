import { BaseMiddleware } from '../base.middleware';
export declare class AuthenticationMiddleware extends BaseMiddleware {
    private readonly logger;
    execute(context: any, next: () => Promise<void>): Promise<void>;
}
