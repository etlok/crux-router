import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { WsAuthMiddleware } from './ws-auth.middleware';
export declare class WsAuthInterceptor implements NestInterceptor {
    private wsAuthMiddleware;
    constructor(wsAuthMiddleware: WsAuthMiddleware);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
}
