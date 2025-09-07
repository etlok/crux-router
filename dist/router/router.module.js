"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterModule = void 0;
const common_1 = require("@nestjs/common");
const router_controller_1 = require("./router.controller");
const router_service_1 = require("./router.service");
const redis_provider_1 = require("../redis/redis.provider");
const nest_winston_1 = require("nest-winston");
const winston_logger_1 = require("../logger/winston-logger");
let RouterModule = class RouterModule {
};
exports.RouterModule = RouterModule;
exports.RouterModule = RouterModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nest_winston_1.WinstonModule.forRoot(winston_logger_1.winstonLoggerOptions)
        ],
        controllers: [router_controller_1.RouterController],
        providers: [router_service_1.RouterService, redis_provider_1.RedisProvider],
    })
], RouterModule);
//# sourceMappingURL=router.module.js.map