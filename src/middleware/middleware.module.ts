import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthMiddleware } from './auth.middleware';
import { WsAuthMiddleware } from './ws-auth.middleware';
import { WsAuthInterceptor } from './ws-auth.interceptor';
import { AuthGuard } from './auth.guard';
import { WsAuthGuard } from './ws-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../redis/redis.module';
import { MiddlewareLoaderService } from './middleware-loader.service';
import { DynamicWsMiddlewareInterceptor } from './dynamic-ws-middleware.interceptor';
import { MiddlewareVisualizerService } from './middleware-visualizer.service';
import { MiddlewareController } from './middleware.controller';
import { MiddlewareManagerController } from './middleware-manager.controller';
import { MiddlewareCodeController } from './middleware-code.controller';
import { MiddlewareConfigService } from './services/middleware-config.service';
import { MiddlewareManagementController } from './middleware-management.controller';
import { CustomMiddlewareRegistry } from './custom-middleware-registry.service';
import { DynamicMiddlewareLoader } from './dynamic-middleware-loader.service';
import { MiddlewareTestGateway } from './middleware-test.gateway';

// Import all middleware to ensure they're included in the module
import './middlewares/authentication.middleware';
import './middlewares/logging.middleware';
import './middlewares/rate-limiting.middleware';
import './middlewares/validation.middleware';
import './middlewares/error-handling.middleware';

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
    MiddlewareController,
    MiddlewareManagerController,
    MiddlewareCodeController,
    MiddlewareManagementController
  ],
  providers: [
    AuthMiddleware,
    WsAuthMiddleware,
    WsAuthInterceptor,
    AuthGuard,
    WsAuthGuard,
    MiddlewareConfigService,
    MiddlewareLoaderService,
    DynamicWsMiddlewareInterceptor,
    MiddlewareVisualizerService,
    MiddlewareTestGateway,
    CustomMiddlewareRegistry,
    DynamicMiddlewareLoader
  ],
  exports: [
    AuthMiddleware,
    WsAuthMiddleware,
    WsAuthInterceptor,
    AuthGuard,
    WsAuthGuard,
    MiddlewareConfigService,
    MiddlewareLoaderService,
    DynamicWsMiddlewareInterceptor,
    MiddlewareVisualizerService,
    CustomMiddlewareRegistry,
    DynamicMiddlewareLoader
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
