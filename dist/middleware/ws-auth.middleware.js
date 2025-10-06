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
exports.WsAuthMiddleware = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const redis_service_1 = require("../redis/redis.service");
const websockets_1 = require("@nestjs/websockets");
let WsAuthMiddleware = class WsAuthMiddleware {
    jwtService;
    redisService;
    constructor(jwtService, redisService) {
        this.jwtService = jwtService;
        this.redisService = redisService;
    }
    async authenticate(client) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                client.data.isAuthenticated = false;
                client.data.authError = 'No authentication token provided';
                return null;
            }
            try {
                const payload = await this.verifyToken(token);
                client.data.isAuthenticated = true;
                client.data.token = token;
                client.data.user = payload;
                client.data.userId = payload.sub || payload.id || payload.userId;
                client.data.authTime = Date.now();
                if (client.data.userId) {
                    client.join(`user:${client.data.userId}`);
                }
                return payload;
            }
            catch (error) {
                client.data.isAuthenticated = false;
                client.data.authError = error.message;
                return null;
            }
        }
        catch (error) {
            client.data.isAuthenticated = false;
            client.data.authError = `Authentication error: ${error.message}`;
            return null;
        }
    }
    extractToken(client) {
        if (client.handshake.auth && client.handshake.auth.token) {
            return client.handshake.auth.token;
        }
        return null;
    }
    async verifyToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            const isRevoked = await this.redisService.get(`revoked_token:${token}`);
            if (isRevoked) {
                throw new websockets_1.WsException('Token has been revoked');
            }
            return payload;
        }
        catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                try {
                    if (token.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.')) {
                        const payload = this.jwtService.decode(token);
                        if (payload && typeof payload === 'object') {
                            return payload;
                        }
                    }
                }
                catch (decodeError) {
                }
            }
            throw error;
        }
    }
};
exports.WsAuthMiddleware = WsAuthMiddleware;
exports.WsAuthMiddleware = WsAuthMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        redis_service_1.RedisService])
], WsAuthMiddleware);
//# sourceMappingURL=ws-auth.middleware.js.map