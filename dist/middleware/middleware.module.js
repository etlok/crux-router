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
const auth_guard_1 = require("./auth.guard");
const jwt_1 = require("@nestjs/jwt");
const redis_module_1 = require("../redis/redis.module");
const middleware_loader_service_1 = require("./middleware-loader.service");
const dynamic_ws_middleware_interceptor_1 = require("./dynamic-ws-middleware.interceptor");
const middleware_config_service_1 = require("./services/middleware-config.service");
const custom_middleware_registry_service_1 = require("./custom-middleware-registry.service");
const dynamic_middleware_loader_service_1 = require("./dynamic-middleware-loader.service");
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
        controllers: [],
        providers: [
            auth_middleware_1.AuthMiddleware,
            auth_guard_1.AuthGuard,
            middleware_config_service_1.MiddlewareConfigService,
            middleware_loader_service_1.MiddlewareLoaderService,
            dynamic_ws_middleware_interceptor_1.DynamicWsMiddlewareInterceptor,
            custom_middleware_registry_service_1.CustomMiddlewareRegistry,
            dynamic_middleware_loader_service_1.DynamicMiddlewareLoader,
        ],
        exports: [
            auth_middleware_1.AuthMiddleware,
            auth_guard_1.AuthGuard,
            middleware_config_service_1.MiddlewareConfigService,
            middleware_loader_service_1.MiddlewareLoaderService,
            dynamic_ws_middleware_interceptor_1.DynamicWsMiddlewareInterceptor,
            custom_middleware_registry_service_1.CustomMiddlewareRegistry,
            dynamic_middleware_loader_service_1.DynamicMiddlewareLoader,
        ],
    })
], MiddlewareModule);
//# sourceMappingURL=middleware.module.js.map