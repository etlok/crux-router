"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisIoAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
let RedisIoAdapter = class RedisIoAdapter extends platform_socket_io_1.IoAdapter {
    adapterConstructor;
    redisService;
    constructor(redisServiceOrApp) {
        if (redisServiceOrApp instanceof redis_service_1.RedisService) {
            super();
            this.redisService = redisServiceOrApp;
        }
        else {
            super(redisServiceOrApp);
            this.redisService = redisServiceOrApp.get(redis_service_1.RedisService);
        }
    }
    async connectToRedis() {
        const { pubClient, subClient } = await this.redisService.getSocketClients();
        this.adapterConstructor = (0, redis_adapter_1.createAdapter)(pubClient, subClient);
    }
    createIOServer(port, options) {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }
};
exports.RedisIoAdapter = RedisIoAdapter;
exports.RedisIoAdapter = RedisIoAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], RedisIoAdapter);
//# sourceMappingURL=redisio-adapter.js.map