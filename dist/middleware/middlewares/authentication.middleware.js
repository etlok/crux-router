"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthenticationMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationMiddleware = void 0;
const common_1 = require("@nestjs/common");
const base_middleware_1 = require("../base.middleware");
let AuthenticationMiddleware = AuthenticationMiddleware_1 = class AuthenticationMiddleware extends base_middleware_1.BaseMiddleware {
    logger = new common_1.Logger(AuthenticationMiddleware_1.name);
    async execute(context, next) {
        if (context.sourceContext) {
            const { isAuthenticated, userId, userInfo } = context.sourceContext;
            context.isAuthenticated = isAuthenticated;
            context.userId = userId;
            context.userInfo = {
                ...userInfo,
                entities: userInfo?.entities || [],
                roles: userInfo?.roles || [],
                permissions: userInfo?.permissions || []
            };
            if (isAuthenticated) {
                this.logger.log(`User is authenticated: ${userId || 'unknown'}`);
                if (context.metadata && context.metadata.middlewareResults) {
                    context.metadata.middlewareResults.authentication = {
                        authenticated: true,
                        userId,
                        timestamp: new Date().toISOString(),
                    };
                }
            }
            else {
                this.logger.log('User is not authenticated');
                if (context.metadata && context.metadata.middlewareResults) {
                    context.metadata.middlewareResults.authentication = {
                        authenticated: false,
                        timestamp: new Date().toISOString(),
                    };
                }
            }
        }
        else {
            this.logger.warn('No source context found, skipping authentication');
            context.isAuthenticated = false;
        }
        await next();
    }
};
exports.AuthenticationMiddleware = AuthenticationMiddleware;
exports.AuthenticationMiddleware = AuthenticationMiddleware = AuthenticationMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, base_middleware_1.Middleware)({ priority: 10 })
], AuthenticationMiddleware);
//# sourceMappingURL=authentication.middleware.js.map