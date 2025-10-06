import 'reflect-metadata';
export declare abstract class BaseMiddleware {
    abstract execute(context: any, next: () => Promise<void>): Promise<void>;
}
export declare function Middleware(options?: {
    priority?: number;
    enabled?: boolean;
}): ClassDecorator;
