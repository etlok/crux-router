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
exports.ExampleWebSocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const dynamic_ws_middleware_interceptor_1 = require("./dynamic-ws-middleware.interceptor");
let ExampleWebSocketGateway = class ExampleWebSocketGateway {
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    handlePing(client, data) {
        return { event: 'pong', data: { received: data.timestamp, sent: Date.now() } };
    }
    async handleAuthenticate(client, data) {
        if (client.data.isAuthenticated) {
            return {
                event: 'authenticated',
                data: {
                    success: true,
                    message: 'Authentication successful',
                    user: {
                        id: client.data.user.sub,
                        name: client.data.user.name
                    }
                }
            };
        }
        else {
            return {
                event: 'authenticated',
                data: {
                    success: false,
                    message: client.data.authError || 'Authentication failed'
                }
            };
        }
    }
    handleProtected(client, data) {
        if (!client.data.isAuthenticated) {
            client.emit('error', {
                code: 'UNAUTHORIZED',
                message: 'Authentication required for this action'
            });
            return;
        }
        return {
            event: 'protected-response',
            data: {
                message: 'You have accessed a protected event',
                user: client.data.user,
                receivedData: data
            }
        };
    }
    handleError() {
        throw new Error('This is a test error');
    }
};
exports.ExampleWebSocketGateway = ExampleWebSocketGateway;
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ExampleWebSocketGateway.prototype, "handlePing", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('authenticate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ExampleWebSocketGateway.prototype, "handleAuthenticate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('protected'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ExampleWebSocketGateway.prototype, "handleProtected", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('trigger-error'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ExampleWebSocketGateway.prototype, "handleError", null);
exports.ExampleWebSocketGateway = ExampleWebSocketGateway = __decorate([
    (0, common_1.UseInterceptors)(dynamic_ws_middleware_interceptor_1.DynamicWsMiddlewareInterceptor),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], ExampleWebSocketGateway);
//# sourceMappingURL=example-ws-gateway.js.map