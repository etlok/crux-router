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
exports.WsAuthInterceptor = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const ws_auth_middleware_1 = require("./ws-auth.middleware");
let WsAuthInterceptor = class WsAuthInterceptor {
    wsAuthMiddleware;
    constructor(wsAuthMiddleware) {
        this.wsAuthMiddleware = wsAuthMiddleware;
    }
    async intercept(context, next) {
        const client = context.switchToWs().getClient();
        const data = context.switchToWs().getData();
        const event = context.getArgByIndex(2)?.event;
        if (event === 'authenticate') {
            return next.handle();
        }
        try {
            await this.wsAuthMiddleware.authenticate(client);
            if (client.data.user) {
                data._user = client.data.user;
            }
            return next.handle();
        }
        catch (err) {
            throw new websockets_1.WsException(`Authentication failed: ${err.message}`);
        }
    }
};
exports.WsAuthInterceptor = WsAuthInterceptor;
exports.WsAuthInterceptor = WsAuthInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ws_auth_middleware_1.WsAuthMiddleware])
], WsAuthInterceptor);
//# sourceMappingURL=ws-auth.interceptor.js.map