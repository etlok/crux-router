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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiController = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const router_service_1 = require("../../router/router.service");
let ApiController = class ApiController {
    redisService;
    webSocketGateway;
    routerService;
    constructor(redisService, webSocketGateway, routerService) {
        this.redisService = redisService;
        this.webSocketGateway = webSocketGateway;
        this.routerService = routerService;
    }
    async handleIncoming(data) {
        console.log('Received REST API Event:', data);
        await this.redisService.publish('', data);
        return { status: 'ok' };
    }
    async notifyClient(data) {
        console.log('Send REST API Event:', data);
        this.webSocketGateway.broadcastEvent('working');
        return { status: 'ok' };
    }
    async handleIncomingWebsocketEvent(data) {
        console.log('Received Event From Websocket:', data);
        this.routerService.routeEvent(data?.eventName, 'Some Extra details');
    }
    async handleIncomingAPIEvent(data) {
        console.log('Received Event From API:', data);
        this.routerService.routeEvent(data?.eventName, 'Some Extra details');
    }
};
exports.ApiController = ApiController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "handleIncoming", null);
__decorate([
    (0, common_1.Post)('/notify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "notifyClient", null);
__decorate([
    (0, common_1.Post)('/websocket/event'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "handleIncomingWebsocketEvent", null);
__decorate([
    (0, common_1.Post)('/api/event'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "handleIncomingAPIEvent", null);
exports.ApiController = ApiController = __decorate([
    (0, common_1.Controller)('events'),
    __metadata("design:paramtypes", [redis_service_1.RedisService, websocket_gateway_1.WSGateway, router_service_1.RouterService])
], ApiController);
//# sourceMappingURL=api.controller.js.map