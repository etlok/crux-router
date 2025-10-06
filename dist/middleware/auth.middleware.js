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
var AuthMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const redis_service_1 = require("../redis/redis.service");
let AuthMiddleware = AuthMiddleware_1 = class AuthMiddleware {
    jwtService;
    redisService;
    logger = new common_1.Logger(AuthMiddleware_1.name);
    constructor(jwtService, redisService) {
        this.jwtService = jwtService;
        this.redisService = redisService;
    }
    async use(req, res, next) {
        try {
            const token = this.extractTokenFromHeader(req);
            if (!token) {
                req['user'] = null;
                return next();
            }
            try {
                const payload = await this.verifyToken(token);
                req['user'] = payload;
                req['isAuthenticated'] = true;
                req['token'] = token;
            }
            catch (error) {
                this.logger.warn(`Invalid token: ${error.message}`);
                req['user'] = null;
                req['isAuthenticated'] = false;
                req['authError'] = error.message;
            }
            next();
        }
        catch (error) {
            this.logger.error(`Authentication middleware error: ${error.message}`);
            next();
        }
    }
    extractTokenFromHeader(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        if (req.query && req.query.token) {
            return req.query.token;
        }
        if (req.body && req.body.auth && req.body.auth.token) {
            return req.body.auth.token;
        }
        if (req.cookies && req.cookies.token) {
            return req.cookies.token;
        }
        return null;
    }
    async verifyToken(token) {
        const payload = this.jwtService.verify(token);
        const isRevoked = await this.redisService.get(`revoked_token:${token}`);
        if (isRevoked) {
            throw new common_1.UnauthorizedException('Token has been revoked');
        }
        return payload;
    }
};
exports.AuthMiddleware = AuthMiddleware;
exports.AuthMiddleware = AuthMiddleware = AuthMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        redis_service_1.RedisService])
], AuthMiddleware);
//# sourceMappingURL=auth.middleware.js.map