"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RateLimitingMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitingMiddleware = void 0;
const common_1 = require("@nestjs/common");
const base_middleware_1 = require("../base.middleware");
let RateLimitingMiddleware = RateLimitingMiddleware_1 = class RateLimitingMiddleware extends base_middleware_1.BaseMiddleware {
    logger = new common_1.Logger(RateLimitingMiddleware_1.name);
    rateLimits = new Map();
    RATE_LIMIT = 50;
    RATE_WINDOW = 60000;
    async execute(context, next) {
        const { client, event } = context;
        if (event === 'authenticate') {
            return next();
        }
        const clientId = client.id;
        const now = Date.now();
        let rateLimitData = this.rateLimits.get(clientId);
        if (!rateLimitData || now > rateLimitData.resetTime) {
            rateLimitData = {
                count: 0,
                resetTime: now + this.RATE_WINDOW,
            };
            this.rateLimits.set(clientId, rateLimitData);
        }
        rateLimitData.count++;
        if (rateLimitData.count > this.RATE_LIMIT) {
            this.logger.warn(`Rate limit exceeded for client: ${clientId}`);
            client.emit('error', {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'You have exceeded the rate limit',
            });
        }
        await next();
    }
};
exports.RateLimitingMiddleware = RateLimitingMiddleware;
exports.RateLimitingMiddleware = RateLimitingMiddleware = RateLimitingMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, base_middleware_1.Middleware)({ priority: 20 })
], RateLimitingMiddleware);
//# sourceMappingURL=rate-limiting.middleware.js.map