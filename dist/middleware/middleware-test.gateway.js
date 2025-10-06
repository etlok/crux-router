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
var MiddlewareTestGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareTestGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const middleware_loader_service_1 = require("./middleware-loader.service");
let MiddlewareTestGateway = MiddlewareTestGateway_1 = class MiddlewareTestGateway {
    middlewareLoaderService;
    server;
    logger = new common_1.Logger(MiddlewareTestGateway_1.name);
    constructor(middlewareLoaderService) {
        this.middlewareLoaderService = middlewareLoaderService;
    }
    async onModuleInit() {
        await this.middlewareLoaderService.initializeMiddleware();
        this.logger.log('Middleware Test Gateway initialized with middleware service');
    }
    async handleAuthTest(client, payload) {
        this.logger.log(`Received auth.test from ${client.id}: ${JSON.stringify(payload)}`);
        const context = {
            client,
            event: 'auth.test',
            data: payload,
            sourceContext: { client },
            middlewareResults: {}
        };
        try {
            const authMiddlewares = this.middlewareLoaderService.getMiddlewares()
                .filter(m => m.name === 'authentication' && m.enabled);
            if (authMiddlewares.length > 0) {
                let index = 0;
                const next = async () => {
                    if (index >= authMiddlewares.length)
                        return;
                    const currentMiddleware = authMiddlewares[index++];
                    await currentMiddleware.middlewareInstance.execute(context, next);
                };
                await next();
            }
            return {
                success: true,
                message: 'Authentication middleware executed',
                isAuthenticated: context.sourceContext?.client?.data?.isAuthenticated || false,
                middlewareResults: context.middlewareResults || {}
            };
        }
        catch (error) {
            this.logger.error(`Error in auth.test: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message,
                middlewareResults: context.middlewareResults || {}
            };
        }
    }
    async handleLoggingTest(client, payload) {
        this.logger.log(`Received logging.test from ${client.id}: ${JSON.stringify(payload)}`);
        const context = {
            client,
            event: 'logging.test',
            data: payload,
            sourceContext: { client },
            middlewareResults: {}
        };
        try {
            const loggingMiddlewares = this.middlewareLoaderService.getMiddlewares()
                .filter(m => m.name === 'logging' && m.enabled);
            if (loggingMiddlewares.length > 0) {
                let index = 0;
                const next = async () => {
                    if (index >= loggingMiddlewares.length)
                        return;
                    const currentMiddleware = loggingMiddlewares[index++];
                    await currentMiddleware.middlewareInstance.execute(context, next);
                };
                await next();
            }
            return {
                success: true,
                message: 'Logging middleware executed',
                middlewareResults: context.middlewareResults || {}
            };
        }
        catch (error) {
            this.logger.error(`Error in logging.test: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message,
                middlewareResults: context.middlewareResults || {}
            };
        }
    }
    async handleValidationTest(client, payload) {
        this.logger.log(`Received validation.test from ${client.id}: ${JSON.stringify(payload)}`);
        const context = {
            client,
            event: 'validation.test',
            data: payload,
            sourceContext: { client },
            middlewareResults: {}
        };
        try {
            const validationMiddlewares = this.middlewareLoaderService.getMiddlewares()
                .filter(m => m.name === 'validation' && m.enabled);
            if (validationMiddlewares.length > 0) {
                let index = 0;
                const next = async () => {
                    if (index >= validationMiddlewares.length)
                        return;
                    const currentMiddleware = validationMiddlewares[index++];
                    await currentMiddleware.middlewareInstance.execute(context, next);
                };
                await next();
            }
            return {
                success: true,
                message: 'Validation middleware executed',
                middlewareResults: context.middlewareResults || {}
            };
        }
        catch (error) {
            this.logger.error(`Error in validation.test: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message,
                middlewareResults: context.middlewareResults || {}
            };
        }
    }
    async handleErrorTest(client, payload) {
        this.logger.log(`Received error.test from ${client.id}: ${JSON.stringify(payload)}`);
        const context = {
            client,
            event: 'error.test',
            data: payload,
            sourceContext: { client },
            middlewareResults: {}
        };
        try {
            if (payload.triggerError) {
                throw new Error('Test error triggered by client request');
            }
            const errorMiddlewares = this.middlewareLoaderService.getMiddlewares()
                .filter(m => m.name === 'error-handling' && m.enabled);
            if (errorMiddlewares.length > 0) {
                let index = 0;
                const next = async () => {
                    if (index >= errorMiddlewares.length)
                        return;
                    const currentMiddleware = errorMiddlewares[index++];
                    await currentMiddleware.middlewareInstance.execute(context, next);
                };
                await next();
            }
            return {
                success: true,
                message: 'Error handling middleware executed',
                middlewareResults: context.middlewareResults || {},
                error: context.error ? context.error.message : null
            };
        }
        catch (error) {
            this.logger.error(`Error in error.test: ${error.message}`, error.stack);
            try {
                const errorMiddleware = this.middlewareLoaderService.getMiddlewares()
                    .find(m => m.name === 'error-handling' && m.enabled);
                if (errorMiddleware) {
                    context.error = error;
                    await errorMiddleware.middlewareInstance.execute(context, async () => { });
                }
            }
            catch (e) {
                this.logger.error(`Error in error handler: ${e.message}`);
            }
            return {
                success: false,
                error: error.message,
                handled: !!context.error,
                middlewareResults: context.middlewareResults || {}
            };
        }
    }
    async handleRateLimitTest(client, payload) {
        this.logger.log(`Received rate-limit.test from ${client.id}: ${JSON.stringify(payload)}`);
        const context = {
            client,
            event: 'rate-limit.test',
            data: payload,
            sourceContext: { client },
            middlewareResults: {}
        };
        try {
            const rateLimitMiddlewares = this.middlewareLoaderService.getMiddlewares()
                .filter(m => m.name === 'rate-limiting' && m.enabled);
            if (rateLimitMiddlewares.length > 0) {
                let index = 0;
                const next = async () => {
                    if (index >= rateLimitMiddlewares.length)
                        return;
                    const currentMiddleware = rateLimitMiddlewares[index++];
                    await currentMiddleware.middlewareInstance.execute(context, next);
                };
                await next();
            }
            return {
                success: true,
                message: 'Rate limiting middleware executed',
                middlewareResults: context.middlewareResults || {}
            };
        }
        catch (error) {
            this.logger.error(`Error in rate-limit.test: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message,
                middlewareResults: context.middlewareResults || {}
            };
        }
    }
    async handleCustomEvent(client, payload) {
        this.logger.log(`Received custom.event from ${client.id}: ${JSON.stringify(payload)}`);
        const context = {
            client,
            event: 'custom.event',
            data: payload,
            sourceContext: { client },
            middlewareResults: {}
        };
        try {
            await this.middlewareLoaderService.executeMiddlewareChain(context);
            return {
                success: true,
                message: 'Custom event processed through middleware chain',
                middlewareResults: context.middlewareResults || {}
            };
        }
        catch (error) {
            this.logger.error(`Error in custom.event: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message,
                middlewareResults: context.middlewareResults || {}
            };
        }
    }
};
exports.MiddlewareTestGateway = MiddlewareTestGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MiddlewareTestGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('auth.test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MiddlewareTestGateway.prototype, "handleAuthTest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('logging.test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MiddlewareTestGateway.prototype, "handleLoggingTest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('validation.test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MiddlewareTestGateway.prototype, "handleValidationTest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('error.test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MiddlewareTestGateway.prototype, "handleErrorTest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('rate-limit.test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MiddlewareTestGateway.prototype, "handleRateLimitTest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('custom.event'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MiddlewareTestGateway.prototype, "handleCustomEvent", null);
exports.MiddlewareTestGateway = MiddlewareTestGateway = MiddlewareTestGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [middleware_loader_service_1.MiddlewareLoaderService])
], MiddlewareTestGateway);
//# sourceMappingURL=middleware-test.gateway.js.map