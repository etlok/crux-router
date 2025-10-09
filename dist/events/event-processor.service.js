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
var EventProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventProcessorService = void 0;
const common_1 = require("@nestjs/common");
const middleware_config_service_1 = require("../middleware/services/middleware-config.service");
const middleware_loader_service_1 = require("../middleware/middleware-loader.service");
const router_service_1 = require("../router/router.service");
let EventProcessorService = EventProcessorService_1 = class EventProcessorService {
    middlewareConfig;
    middlewareLoader;
    routerService;
    logger = new common_1.Logger(EventProcessorService_1.name);
    constructor(middlewareConfig, middlewareLoader, routerService) {
        this.middlewareConfig = middlewareConfig;
        this.middlewareLoader = middlewareLoader;
        this.routerService = routerService;
    }
    async processEvent(eventPayload, sourceContext = {}) {
        this.logger.log(`Processing event: ${eventPayload.event}`);
        try {
            const context = {
                event: eventPayload.event,
                eventConfig: eventPayload.config,
                sourceContext,
                data: eventPayload,
                result: null,
                metadata: {
                    startTime: Date.now(),
                    middlewareResults: {},
                },
            };
            await this.middlewareConfig.setActiveMiddleware(eventPayload.middleware);
            await this.middlewareLoader.executeMiddlewareChain(context);
            this.logger.log('Middleware execution successful!');
            if (eventPayload.actions && eventPayload.actions.length > 0) {
                context.result = await this.processActions(eventPayload.actions, context);
            }
            this.logger.log(`Completed processing event: ${eventPayload.event}`);
            return this.sanitizeResult(context.result);
        }
        catch (error) {
            this.logger.error(`Error processing event ${eventPayload.event}: ${error.message}`);
            throw error;
        }
    }
    async processActions(actions, context) {
        const results = [];
        for (const action of actions) {
            try {
                this.logger.log(`Executing action: ${action.type}`);
                const result = await this.routerService.routeEvent(action.workflow);
                results.push(result);
            }
            catch (error) {
                this.logger.error(`Error executing action ${action.type}: ${error.message}`);
                throw error;
            }
        }
        return results;
    }
    sanitizeResult(result) {
        if (!result)
            return result;
        try {
            const seen = new WeakSet();
            return JSON.parse(JSON.stringify(result, (key, value) => {
                if (typeof value === 'function' || typeof value === 'undefined') {
                    return undefined;
                }
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        return '[Circular Reference]';
                    }
                    seen.add(value);
                }
                return value;
            }));
        }
        catch (error) {
            this.logger.error(`Error sanitizing result: ${error.message}`);
            if (Array.isArray(result)) {
                return result.map((item) => this.createSafeObject(item));
            }
            else {
                return this.createSafeObject(result);
            }
        }
    }
    createSafeObject(obj) {
        if (!obj || typeof obj !== 'object')
            return obj;
        const safeObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                if (value === null || value === undefined) {
                    safeObj[key] = value;
                }
                else if (typeof value !== 'object' && typeof value !== 'function') {
                    safeObj[key] = value;
                }
                else if (typeof value === 'object') {
                    if (Array.isArray(value)) {
                        safeObj[key] = '[Array]';
                    }
                    else {
                        safeObj[key] = '[Object]';
                    }
                }
            }
        }
        return safeObj;
    }
};
exports.EventProcessorService = EventProcessorService;
exports.EventProcessorService = EventProcessorService = EventProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [middleware_config_service_1.MiddlewareConfigService,
        middleware_loader_service_1.MiddlewareLoaderService,
        router_service_1.RouterService])
], EventProcessorService);
//# sourceMappingURL=event-processor.service.js.map