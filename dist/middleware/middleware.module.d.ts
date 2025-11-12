import { NestModule, MiddlewareConsumer } from '@nestjs/common';
import './middlewares/authentication.middleware';
import './middlewares/logging.middleware';
import './middlewares/rate-limiting.middleware';
import './middlewares/validation.middleware';
import './middlewares/error-handling.middleware';
import './middlewares/channel-subscription.middleware';
export declare class MiddlewareModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void;
}
