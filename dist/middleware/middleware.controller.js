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
var MiddlewareController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareController = void 0;
const common_1 = require("@nestjs/common");
const middleware_visualizer_service_1 = require("./middleware-visualizer.service");
const middleware_loader_service_1 = require("./middleware-loader.service");
const middleware_config_service_1 = require("./services/middleware-config.service");
let MiddlewareController = MiddlewareController_1 = class MiddlewareController {
    middlewareVisualizer;
    middlewareLoader;
    middlewareConfig;
    logger = new common_1.Logger(MiddlewareController_1.name);
    constructor(middlewareVisualizer, middlewareLoader, middlewareConfig) {
        this.middlewareVisualizer = middlewareVisualizer;
        this.middlewareLoader = middlewareLoader;
        this.middlewareConfig = middlewareConfig;
    }
    async getMiddlewares() {
        return this.middlewareLoader.getMiddlewares().map(middleware => ({
            name: middleware.name,
            priority: middleware.priority,
            enabled: middleware.enabled
        }));
    }
    async visualize() {
        return {
            visualization: this.middlewareVisualizer.visualizeMiddlewareChain(),
            statistics: this.middlewareVisualizer.getMiddlewareStatistics()
        };
    }
    async toggleMiddleware(name, state) {
        const enabled = state === 'enable';
        const success = this.middlewareLoader.setMiddlewareState(name, enabled);
        return {
            success,
            message: success
                ? `Middleware ${name} ${enabled ? 'enabled' : 'disabled'} successfully`
                : `Middleware ${name} not found`
        };
    }
    async getConfigs() {
        const configs = await this.middlewareConfig.getAllConfigs();
        return {
            success: true,
            configs
        };
    }
    async getActiveMiddleware() {
        const active = await this.middlewareConfig.getActiveMiddleware();
        return {
            success: true,
            active
        };
    }
    async setActiveMiddleware(body) {
        try {
            await this.middlewareConfig.setActiveMiddleware(body.keys);
            return {
                success: true,
                message: `Set ${body.keys.length} active middleware keys`
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    async reloadMiddlewareConfig() {
        try {
            await this.middlewareConfig.loadConfigFromFileToRedis();
            return {
                success: true,
                message: 'Middleware configurations reloaded successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
};
exports.MiddlewareController = MiddlewareController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MiddlewareController.prototype, "getMiddlewares", null);
__decorate([
    (0, common_1.Get)('visualization'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MiddlewareController.prototype, "visualize", null);
__decorate([
    (0, common_1.Get)('toggle/:name/:state'),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Param)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MiddlewareController.prototype, "toggleMiddleware", null);
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MiddlewareController.prototype, "getConfigs", null);
__decorate([
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MiddlewareController.prototype, "getActiveMiddleware", null);
__decorate([
    (0, common_1.Post)('active'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddlewareController.prototype, "setActiveMiddleware", null);
__decorate([
    (0, common_1.Post)('reload'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MiddlewareController.prototype, "reloadMiddlewareConfig", null);
exports.MiddlewareController = MiddlewareController = MiddlewareController_1 = __decorate([
    (0, common_1.Controller)('middleware'),
    __metadata("design:paramtypes", [middleware_visualizer_service_1.MiddlewareVisualizerService,
        middleware_loader_service_1.MiddlewareLoaderService,
        middleware_config_service_1.MiddlewareConfigService])
], MiddlewareController);
//# sourceMappingURL=middleware.controller.js.map