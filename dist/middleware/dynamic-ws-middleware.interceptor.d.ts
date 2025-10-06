import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MiddlewareLoaderService } from './middleware-loader.service';
export declare class DynamicWsMiddlewareInterceptor implements NestInterceptor {
    private middlewareLoader;
    private readonly logger;
    private initialized;
    constructor(middlewareLoader: MiddlewareLoaderService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
}
