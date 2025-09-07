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
exports.RedisEventListenerService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("./redis.service");
const websocket_gateway_1 = require("../sources/websocket/websocket.gateway");
let RedisEventListenerService = class RedisEventListenerService {
    redisService;
    socketGateway;
    constructor(redisService, socketGateway) {
        this.redisService = redisService;
        this.socketGateway = socketGateway;
    }
    async onModuleInit() {
        await this.redisService.subscribe('global-events', (message) => {
            this.socketGateway.broadcastEvent(message);
        });
    }
};
exports.RedisEventListenerService = RedisEventListenerService;
exports.RedisEventListenerService = RedisEventListenerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        websocket_gateway_1.WSGateway])
], RedisEventListenerService);
//# sourceMappingURL=redis-event-listener.service.js.map