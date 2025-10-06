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
exports.MiddlewareManagementController = void 0;
const common_1 = require("@nestjs/common");
const custom_middleware_registry_service_1 = require("./custom-middleware-registry.service");
const dynamic_middleware_loader_service_1 = require("./dynamic-middleware-loader.service");
const middleware_loader_service_1 = require("./middleware-loader.service");
const middleware_config_service_1 = require("./services/middleware-config.service");
class RegisterMiddlewareDto {
    key;
    code;
    config;
    metadata;
}
class UpdateMiddlewareDto {
    code;
    config;
    metadata;
}
const tenantAuthGuard = { canActivate: () => true };
let MiddlewareManagementController = class MiddlewareManagementController {
    customMiddlewareRegistry;
    dynamicMiddlewareLoader;
    middlewareLoaderService;
    middlewareConfigService;
    constructor(customMiddlewareRegistry, dynamicMiddlewareLoader, middlewareLoaderService, middlewareConfigService) {
        this.customMiddlewareRegistry = customMiddlewareRegistry;
        this.dynamicMiddlewareLoader = dynamicMiddlewareLoader;
        this.middlewareLoaderService = middlewareLoaderService;
        this.middlewareConfigService = middlewareConfigService;
    }
    async getAllMiddleware() {
        return this.customMiddlewareRegistry.getAllMiddleware();
    }
    async getMiddleware(key) {
        const middleware = await this.customMiddlewareRegistry.getMiddleware(key);
        if (!middleware) {
            return { error: `Middleware '${key}' not found` };
        }
        return middleware;
    }
    async registerMiddleware(dto) {
        try {
            const id = await this.customMiddlewareRegistry.registerMiddleware(dto.key, dto.code, dto.config || {}, dto.metadata || {});
            const middleware = await this.dynamicMiddlewareLoader.loadCustomMiddleware(dto.key);
            if (!middleware) {
                await this.customMiddlewareRegistry.deleteMiddleware(dto.key);
                return { error: `Failed to load middleware '${dto.key}'` };
            }
            this.dynamicMiddlewareLoader.clearCache(dto.key);
            return {
                id,
                key: dto.key,
                message: `Middleware '${dto.key}' registered successfully`
            };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async updateMiddleware(key, dto) {
        try {
            await this.customMiddlewareRegistry.updateMiddleware(key, dto.code, dto.config, dto.metadata);
            this.dynamicMiddlewareLoader.clearCache(key);
            return { message: `Middleware '${key}' updated successfully` };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async deleteMiddleware(key) {
        try {
            await this.customMiddlewareRegistry.deleteMiddleware(key);
            this.dynamicMiddlewareLoader.clearCache(key);
            return { message: `Middleware '${key}' deleted successfully` };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async testMiddleware(key, testContext) {
        try {
            this.dynamicMiddlewareLoader.clearCache(key);
            const middleware = await this.dynamicMiddlewareLoader.loadCustomMiddleware(key);
            if (!middleware) {
                return { error: `Middleware '${key}' not found or invalid` };
            }
            const context = testContext || {
                event: 'test_event',
                sourceContext: {
                    isAuthenticated: true,
                    userId: 'test-user',
                    userInfo: { name: 'Test User' }
                },
                metadata: {
                    middlewareResults: {}
                }
            };
            let nextCalled = false;
            const next = async () => {
                nextCalled = true;
                return Promise.resolve();
            };
            await middleware.execute(context, next);
            return {
                message: `Middleware '${key}' executed successfully`,
                nextCalled,
                resultingContext: context
            };
        }
        catch (error) {
            return {
                error: `Error testing middleware '${key}': ${error.message}`,
                stack: error.stack
            };
        }
    }
    async testMiddlewareChain(body) {
        try {
            const { middlewareKeys, context: initialContext } = body;
            await this.middlewareConfigService.setActiveMiddleware(middlewareKeys);
            const context = initialContext || {
                event: 'test_event',
                sourceContext: {
                    isAuthenticated: true,
                    userId: 'test-user',
                    userInfo: { name: 'Test User' }
                },
                metadata: {
                    startTime: Date.now(),
                    middlewareResults: {},
                }
            };
            await this.middlewareLoaderService.executeMiddlewareChain(context);
            if (context.metadata) {
                context.metadata.endTime = Date.now();
                context.metadata.duration = context.metadata.endTime - context.metadata.startTime;
            }
            return {
                message: `Middleware chain executed successfully`,
                middlewareKeys,
                resultingContext: context
            };
        }
        catch (error) {
            return {
                error: `Error testing middleware chain: ${error.message}`,
                stack: error.stack
            };
        }
    }
};
exports.MiddlewareManagementController = MiddlewareManagementController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(tenantAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MiddlewareManagementController.prototype, "getAllMiddleware", null);
__decorate([
    (0, common_1.Get)(':key'),
    (0, common_1.UseGuards)(tenantAuthGuard),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MiddlewareManagementController.prototype, "getMiddleware", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(tenantAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterMiddlewareDto]),
    __metadata("design:returntype", Promise)
], MiddlewareManagementController.prototype, "registerMiddleware", null);
__decorate([
    (0, common_1.Put)(':key'),
    (0, common_1.UseGuards)(tenantAuthGuard),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateMiddlewareDto]),
    __metadata("design:returntype", Promise)
], MiddlewareManagementController.prototype, "updateMiddleware", null);
__decorate([
    (0, common_1.Delete)(':key'),
    (0, common_1.UseGuards)(tenantAuthGuard),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MiddlewareManagementController.prototype, "deleteMiddleware", null);
__decorate([
    (0, common_1.Post)(':key/test'),
    (0, common_1.UseGuards)(tenantAuthGuard),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MiddlewareManagementController.prototype, "testMiddleware", null);
__decorate([
    (0, common_1.Post)('chain/test'),
    (0, common_1.UseGuards)(tenantAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddlewareManagementController.prototype, "testMiddlewareChain", null);
exports.MiddlewareManagementController = MiddlewareManagementController = __decorate([
    (0, common_1.Controller)('api/middleware'),
    __metadata("design:paramtypes", [custom_middleware_registry_service_1.CustomMiddlewareRegistry,
        dynamic_middleware_loader_service_1.DynamicMiddlewareLoader,
        middleware_loader_service_1.MiddlewareLoaderService,
        middleware_config_service_1.MiddlewareConfigService])
], MiddlewareManagementController);
//# sourceMappingURL=middleware-management.controller.js.map