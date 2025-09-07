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
var ClientAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAuthService = void 0;
const redis_service_1 = require("../../redis/redis.service");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
let ClientAuthService = ClientAuthService_1 = class ClientAuthService {
    redisService;
    jwtService;
    logger = new common_1.Logger(ClientAuthService_1.name);
    constructor(redisService, jwtService) {
        this.redisService = redisService;
        this.jwtService = jwtService;
    }
    async validateToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            const isRevoked = await this.redisService.get(`revoked_token:${token}`);
            if (isRevoked) {
                this.logger.warn(`Attempt to use revoked token: ${token}`);
                throw new common_1.UnauthorizedException('Token has been revoked');
            }
            return payload;
        }
        catch (error) {
            this.logger.error(`JWT validation error: ${error.message}`);
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
    generateToken(payload) {
        return this.jwtService.sign(payload);
    }
    async revokeToken(token, expiry) {
        try {
            const decoded = this.jwtService.decode(token);
            const expiryTime = expiry || (decoded && decoded['exp']
                ? decoded['exp'] - Math.floor(Date.now() / 1000) + 10
                : 3600);
            await this.redisService.set(`revoked_token:${token}`, 'true', expiryTime);
            this.logger.log(`Token revoked: ${token.substring(0, 10)}...`);
        }
        catch (error) {
            this.logger.error(`Failed to revoke token: ${error.message}`);
        }
    }
};
exports.ClientAuthService = ClientAuthService;
exports.ClientAuthService = ClientAuthService = ClientAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        jwt_1.JwtService])
], ClientAuthService);
//# sourceMappingURL=client-auth.service.js.map