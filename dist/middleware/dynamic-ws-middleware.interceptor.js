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
var DynamicWsMiddlewareInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicWsMiddlewareInterceptor = void 0;
const common_1 = require("@nestjs/common");
const middleware_loader_service_1 = require("./middleware-loader.service");
let DynamicWsMiddlewareInterceptor = DynamicWsMiddlewareInterceptor_1 = class DynamicWsMiddlewareInterceptor {
    middlewareLoader;
    logger = new common_1.Logger(DynamicWsMiddlewareInterceptor_1.name);
    initialized = false;
    constructor(middlewareLoader) {
        this.middlewareLoader = middlewareLoader;
    }
    async intercept(context, next) {
        if (!this.initialized) {
            await this.middlewareLoader.initializeMiddleware();
            this.initialized = true;
        }
        if (context.getType() !== 'ws') {
            return next.handle();
        }
        const client = context.switchToWs().getClient();
        const data = context.switchToWs().getData();
        const eventInfo = context.getArgByIndex(2);
        const event = eventInfo?.event || 'unknown';
        const middlewareContext = {
            client,
            data,
            event,
            eventInfo,
            timestamp: Date.now(),
            metadata: {},
        };
        try {
            await this.middlewareLoader.executeMiddlewareChain(middlewareContext);
            return next.handle();
        }
        catch (error) {
            this.logger.error(`Middleware chain error: ${error.message}`);
            throw error;
        }
    }
};
exports.DynamicWsMiddlewareInterceptor = DynamicWsMiddlewareInterceptor;
exports.DynamicWsMiddlewareInterceptor = DynamicWsMiddlewareInterceptor = DynamicWsMiddlewareInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [middleware_loader_service_1.MiddlewareLoaderService])
], DynamicWsMiddlewareInterceptor);
//# sourceMappingURL=dynamic-ws-middleware.interceptor.js.map