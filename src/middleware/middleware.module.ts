import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthMiddleware } from './auth.middleware';
import { AuthGuard } from './auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../redis/redis.module';
import { MiddlewareLoaderService } from './middleware-loader.service';
import { DynamicWsMiddlewareInterceptor } from './dynamic-ws-middleware.interceptor';
import { MiddlewareConfigService } from './services/middleware-config.service';
import { CustomMiddlewareRegistry } from './custom-middleware-registry.service';
import { DynamicMiddlewareLoader } from './dynamic-middleware-loader.service';

// Import all middleware to ensure they're included in the module
import './middlewares/authentication.middleware';
import './middlewares/logging.middleware';
import './middlewares/rate-limiting.middleware';
import './middlewares/validation.middleware';
import './middlewares/error-handling.middleware';
import './middlewares/channel-subscription.middleware';

@Module({
  imports: [
    // Re-use the JWT module configuration
    JwtModule.register({
      // Note: Ideally get these values from configuration
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    RedisModule,
  ],
  controllers: [
 
  ],
  providers: [
    AuthMiddleware,
    AuthGuard,
    MiddlewareConfigService,
    MiddlewareLoaderService,
    DynamicWsMiddlewareInterceptor,
    CustomMiddlewareRegistry,
    DynamicMiddlewareLoader,
  ],
  exports: [
    AuthMiddleware,
    AuthGuard,
    MiddlewareConfigService,
    MiddlewareLoaderService,
    DynamicWsMiddlewareInterceptor,
    CustomMiddlewareRegistry,
    DynamicMiddlewareLoader,
  ],
})
export class MiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the HTTP auth middleware to specific routes
    // You can customize this to apply to specific routes
    consumer
      .apply(AuthMiddleware)
      .forRoutes('websocket/initialize', 'websocket/broadcast');

    // For global application, you'd use:
    // consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
