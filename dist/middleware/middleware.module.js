"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareModule = void 0;
const common_1 = require("@nestjs/common");
const auth_middleware_1 = require("./auth.middleware");
const ws_auth_middleware_1 = require("./ws-auth.middleware");
const ws_auth_interceptor_1 = require("./ws-auth.interceptor");
const auth_guard_1 = require("./auth.guard");
const ws_auth_guard_1 = require("./ws-auth.guard");
const jwt_1 = require("@nestjs/jwt");
const redis_module_1 = require("../redis/redis.module");
const middleware_loader_service_1 = require("./middleware-loader.service");
const dynamic_ws_middleware_interceptor_1 = require("./dynamic-ws-middleware.interceptor");
const middleware_visualizer_service_1 = require("./middleware-visualizer.service");
const middleware_controller_1 = require("./middleware.controller");
const middleware_manager_controller_1 = require("./middleware-manager.controller");
const middleware_code_controller_1 = require("./middleware-code.controller");
const middleware_config_service_1 = require("./services/middleware-config.service");
const middleware_management_controller_1 = require("./middleware-management.controller");
const custom_middleware_registry_service_1 = require("./custom-middleware-registry.service");
const dynamic_middleware_loader_service_1 = require("./dynamic-middleware-loader.service");
const middleware_test_gateway_1 = require("./middleware-test.gateway");
require("./middlewares/authentication.middleware");
require("./middlewares/logging.middleware");
require("./middlewares/rate-limiting.middleware");
require("./middlewares/validation.middleware");
require("./middlewares/error-handling.middleware");
let MiddlewareModule = class MiddlewareModule {
    configure(consumer) {
        consumer
            .apply(auth_middleware_1.AuthMiddleware)
            .forRoutes('websocket/initialize', 'websocket/broadcast');
    }
};
exports.MiddlewareModule = MiddlewareModule;
exports.MiddlewareModule = MiddlewareModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'your-secret-key',
                signOptions: { expiresIn: '7d' },
            }),
            redis_module_1.RedisModule,
        ],
        controllers: [
            middleware_controller_1.MiddlewareController,
            middleware_manager_controller_1.MiddlewareManagerController,
            middleware_code_controller_1.MiddlewareCodeController,
            middleware_management_controller_1.MiddlewareManagementController
        ],
        providers: [
            auth_middleware_1.AuthMiddleware,
            ws_auth_middleware_1.WsAuthMiddleware,
            ws_auth_interceptor_1.WsAuthInterceptor,
            auth_guard_1.AuthGuard,
            ws_auth_guard_1.WsAuthGuard,
            middleware_config_service_1.MiddlewareConfigService,
            middleware_loader_service_1.MiddlewareLoaderService,
            dynamic_ws_middleware_interceptor_1.DynamicWsMiddlewareInterceptor,
            middleware_visualizer_service_1.MiddlewareVisualizerService,
            middleware_test_gateway_1.MiddlewareTestGateway,
            custom_middleware_registry_service_1.CustomMiddlewareRegistry,
            dynamic_middleware_loader_service_1.DynamicMiddlewareLoader
        ],
        exports: [
            auth_middleware_1.AuthMiddleware,
            ws_auth_middleware_1.WsAuthMiddleware,
            ws_auth_interceptor_1.WsAuthInterceptor,
            auth_guard_1.AuthGuard,
            ws_auth_guard_1.WsAuthGuard,
            middleware_config_service_1.MiddlewareConfigService,
            middleware_loader_service_1.MiddlewareLoaderService,
            dynamic_ws_middleware_interceptor_1.DynamicWsMiddlewareInterceptor,
            middleware_visualizer_service_1.MiddlewareVisualizerService,
            custom_middleware_registry_service_1.CustomMiddlewareRegistry,
            dynamic_middleware_loader_service_1.DynamicMiddlewareLoader
        ],
    })
], MiddlewareModule);
//# sourceMappingURL=middleware.module.js.map