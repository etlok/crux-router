"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const redis_module_1 = require("./redis/redis.module");
const api_controller_1 = require("./sources/api/api.controller");
const websocket_gateway_1 = require("./sources/websocket/websocket.gateway");
const redis_service_1 = require("./redis/redis.service");
const config_1 = require("@nestjs/config");
const redis_config_1 = require("./config/redis.config");
const jwt_config_1 = require("./config/jwt.config");
const router_module_1 = require("./router/router.module");
const kafka_module_1 = require("./sources/kafka/kafka.module");
const websocket_module_1 = require("./sources/websocket/websocket.module");
const router_service_1 = require("./router/router.service");
const client_auth_service_1 = require("./sources/websocket/client-auth.service");
const jwt_module_1 = require("./auth/jwt.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            redis_module_1.RedisModule,
            router_module_1.RouterModule,
            websocket_module_1.WebsocketModule,
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [redis_config_1.default, jwt_config_1.default],
            }),
            jwt_module_1.JwtModule,
            kafka_module_1.KafkaModule.register()
        ],
        controllers: [api_controller_1.ApiController],
        providers: [websocket_gateway_1.WSGateway, redis_service_1.RedisService, router_service_1.RouterService, client_auth_service_1.ClientAuthService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map