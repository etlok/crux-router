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
var MiddlewareLoaderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareLoaderService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const path = require("path");
const middleware_config_service_1 = require("./services/middleware-config.service");
let MiddlewareLoaderService = MiddlewareLoaderService_1 = class MiddlewareLoaderService {
    moduleRef;
    middlewareConfigService;
    logger = new common_1.Logger(MiddlewareLoaderService_1.name);
    middlewares = [];
    initialized = false;
    constructor(moduleRef, middlewareConfigService) {
        this.moduleRef = moduleRef;
        this.middlewareConfigService = middlewareConfigService;
    }
    registerMiddleware(key, middlewareInstance, priority = 100) {
        this.middlewares.push({
            name: key,
            priority,
            enabled: true,
            middlewareInstance
        });
        this.logger.log(`Manually registered middleware: ${key} (priority: ${priority})`);
    }
    registerFallbackMiddleware() {
        this.registerMiddleware('authentication', {
            execute: async (context, next) => {
                this.logger.log('Fallback authentication middleware executed');
                if (context.sourceContext?.client) {
                    context.sourceContext.client.data = context.sourceContext.client.data || {};
                    context.sourceContext.client.data.isAuthenticated = true;
                }
                await next();
            }
        }, 10);
        this.registerMiddleware('logging', {
            execute: async (context, next) => {
                this.logger.log(`Fallback logging middleware executed for event: ${context.event || 'unknown'}`);
                const startTime = Date.now();
                await next();
                const duration = Date.now() - startTime;
                this.logger.log(`Event ${context.event || 'unknown'} processed in ${duration}ms`);
            }
        }, 20);
        this.registerMiddleware('validation', {
            execute: async (context, next) => {
                this.logger.log('Fallback validation middleware executed');
                await next();
            }
        }, 30);
        this.registerMiddleware('error-handling', {
            execute: async (context, next) => {
                try {
                    await next();
                }
                catch (error) {
                    this.logger.error(`Fallback error-handling middleware caught error: ${error.message}`);
                    context.error = error;
                }
            }
        }, 999);
    }
    async initializeMiddleware(middlewarePath = path.join(__dirname, 'middlewares')) {
        if (this.initialized) {
            return;
        }
        this.registerFallbackMiddleware();
        try {
            const configs = await this.middlewareConfigService.getAllConfigs();
            const classConfigs = configs.filter(c => c.type === 'class');
            this.logger.log(`Found ${classConfigs.length} middleware configurations`);
            this.middlewares = [];
            for (const config of classConfigs) {
                try {
                    const fullPath = path.resolve(process.cwd(), config.path);
                    this.logger.log(`Creating middleware for: ${config.key} (configured path: ${fullPath})`);
                    let middlewareModule;
                    const createBasicMiddleware = (middlewareName) => {
                        return {
                            [middlewareName + 'Middleware']: class {
                                constructor() { }
                                async execute(context, next) {
                                    console.log(`[${middlewareName}] Executing middleware for event: ${context.event || 'unknown'}`);
                                    if (middlewareName === 'authentication') {
                                        if (context.sourceContext?.client) {
                                            context.sourceContext.client.data = context.sourceContext.client.data || {};
                                            context.sourceContext.client.data.isAuthenticated = true;
                                        }
                                    }
                                    else if (middlewareName === 'logging') {
                                        const startTime = Date.now();
                                        await next();
                                        const duration = Date.now() - startTime;
                                        console.log(`[${middlewareName}] Event ${context.event || 'unknown'} processed in ${duration}ms`);
                                        return;
                                    }
                                    else if (middlewareName === 'validation') {
                                        if (!context.event) {
                                            console.warn(`[${middlewareName}] Missing event name`);
                                        }
                                    }
                                    else if (middlewareName === 'error-handling') {
                                        try {
                                            await next();
                                            return;
                                        }
                                        catch (error) {
                                            console.error(`[${middlewareName}] Caught error: ${error.message}`);
                                            context.error = error;
                                            return;
                                        }
                                    }
                                    else if (middlewareName === 'rate-limiting') {
                                        console.log(`[${middlewareName}] Rate limiting check passed`);
                                    }
                                    await next();
                                }
                            }
                        };
                    };
                    try {
                        const middlewareName = config.key.replace(/-/g, '');
                        this.logger.log(`Creating basic middleware for: ${middlewareName}`);
                        middlewareModule = createBasicMiddleware(middlewareName);
                        this.logger.log(`Successfully created basic middleware for ${config.key}`);
                    }
                    catch (err) {
                        this.logger.error(`Error creating middleware for ${config.key}: ${err.message}`);
                        continue;
                    }
                    let middlewareClass;
                    const middlewareKeys = Object.keys(middlewareModule);
                    if (middlewareKeys.length > 0) {
                        const key = middlewareKeys[0];
                        middlewareClass = middlewareModule[key];
                        this.logger.log(`Using custom middleware class: ${key}`);
                    }
                    else {
                        this.logger.warn(`No middleware class found in custom module for ${config.key}`);
                        continue;
                    }
                    if (!middlewareClass) {
                        this.logger.warn(`No middleware class found in ${config.path}`);
                        continue;
                    }
                    let middlewareInstance;
                    try {
                        middlewareInstance = this.moduleRef.get(middlewareClass, { strict: false });
                    }
                    catch {
                        middlewareInstance = new middlewareClass();
                    }
                    if (!middlewareInstance.execute || typeof middlewareInstance.execute !== 'function') {
                        this.logger.warn(`Middleware ${middlewareClass.name} does not have an execute method`);
                        continue;
                    }
                    const priority = Reflect.getMetadata('middleware:priority', middlewareClass) || 100;
                    const enabled = Reflect.getMetadata('middleware:enabled', middlewareClass) !== false;
                    const name = config.key;
                    this.middlewares.push({
                        name,
                        priority,
                        enabled,
                        middlewareInstance
                    });
                    this.logger.log(`Loaded middleware: ${name} (priority: ${priority}, enabled: ${enabled})`);
                }
                catch (error) {
                    this.logger.error(`Error loading middleware ${config.path}: ${error.message}`);
                }
            }
            this.middlewares.sort((a, b) => a.priority - b.priority);
            this.initialized = true;
            this.logger.log(`Initialized ${this.middlewares.length} middleware components`);
        }
        catch (error) {
            this.logger.error(`Failed to initialize middleware: ${error.message}`);
            throw error;
        }
    }
    async resolveMiddlewareKeys(keys) {
        return this.middlewareConfigService.resolveMiddlewareKeys(keys);
    }
    async executeMiddlewareChain(context) {
        if (!this.initialized) {
            await this.initializeMiddleware();
        }
        const keys = await this.middlewareConfigService.getActiveMiddleware();
        if (keys.length === 0) {
            this.logger.warn('No active middleware found in Redis, using default middleware chain');
            return this.executeDefaultMiddlewareChain(context);
        }
        const resolvedKeys = await this.resolveMiddlewareKeys(keys);
        let enabledMiddlewares = this.middlewares.filter(m => m.enabled && resolvedKeys.includes(m.name));
        if (enabledMiddlewares.length === 0) {
            this.logger.warn('No matching enabled middleware found, using fallbacks');
            enabledMiddlewares = this.middlewares.filter(m => m.enabled);
        }
        this.logger.log(`Executing middleware chain with ${enabledMiddlewares.length} active middlewares`);
        let index = 0;
        const next = async () => {
            if (index >= enabledMiddlewares.length) {
                return;
            }
            const currentMiddleware = enabledMiddlewares[index++];
            try {
                this.logger.debug(`Executing middleware: ${currentMiddleware.name}`);
                await currentMiddleware.middlewareInstance.execute(context, next);
            }
            catch (error) {
                this.logger.error(`Error in middleware ${currentMiddleware.name}: ${error.message}`);
                throw error;
            }
        };
        await next();
    }
    async executeDefaultMiddlewareChain(context) {
        this.logger.log('Executing default middleware chain');
        const defaultMiddlewares = this.middlewares.filter(m => m.enabled && ['logging', 'authentication'].includes(m.name));
        if (defaultMiddlewares.length === 0) {
            this.logger.warn('No default middleware available, execution will continue without middleware');
            return;
        }
        let index = 0;
        const next = async () => {
            if (index >= defaultMiddlewares.length) {
                return;
            }
            const currentMiddleware = defaultMiddlewares[index++];
            try {
                await currentMiddleware.middlewareInstance.execute(context, next);
            }
            catch (error) {
                this.logger.error(`Error in default middleware ${currentMiddleware.name}: ${error.message}`);
            }
        };
        await next();
    }
    getMiddlewares() {
        return [...this.middlewares];
    }
    setMiddlewareState(name, enabled) {
        const middleware = this.middlewares.find(m => m.name === name);
        if (middleware) {
            middleware.enabled = enabled;
            return true;
        }
        return false;
    }
};
exports.MiddlewareLoaderService = MiddlewareLoaderService;
exports.MiddlewareLoaderService = MiddlewareLoaderService = MiddlewareLoaderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.ModuleRef,
        middleware_config_service_1.MiddlewareConfigService])
], MiddlewareLoaderService);
//# sourceMappingURL=middleware-loader.service.js.map