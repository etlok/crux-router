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
var DynamicMiddlewareLoader_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicMiddlewareLoader = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const vm = require("vm");
const fs = require("fs/promises");
const middleware_config_service_1 = require("./services/middleware-config.service");
const custom_middleware_registry_service_1 = require("./custom-middleware-registry.service");
let DynamicMiddlewareLoader = DynamicMiddlewareLoader_1 = class DynamicMiddlewareLoader {
    moduleRef;
    middlewareConfigService;
    customMiddlewareRegistry;
    logger = new common_1.Logger(DynamicMiddlewareLoader_1.name);
    sandboxCache = new Map();
    constructor(moduleRef, middlewareConfigService, customMiddlewareRegistry) {
        this.moduleRef = moduleRef;
        this.middlewareConfigService = middlewareConfigService;
        this.customMiddlewareRegistry = customMiddlewareRegistry;
    }
    async loadCustomMiddleware(key) {
        try {
            if (this.sandboxCache.has(key)) {
                this.logger.log(`Using cached middleware for '${key}'`);
                return this.sandboxCache.get(key);
            }
            const middlewareConfig = await this.customMiddlewareRegistry.getMiddleware(key);
            if (!middlewareConfig) {
                this.logger.warn(`Middleware '${key}' not found`);
                return null;
            }
            if (!middlewareConfig.path) {
                this.logger.warn(`No file path for middleware '${key}'`);
                return null;
            }
            const code = await fs.readFile(middlewareConfig.path, 'utf8');
            const sandbox = this.createSandbox(key, middlewareConfig.config);
            const middlewareInstance = await this.createMiddlewareInstance(key, code, sandbox);
            if (middlewareInstance) {
                this.sandboxCache.set(key, middlewareInstance);
                return middlewareInstance;
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Error loading custom middleware '${key}': ${error.message}`);
            return null;
        }
    }
    createSandbox(key, config = {}) {
        const console = {
            log: (...args) => this.logger.log(`[${key}] ${args.join(' ')}`),
            warn: (...args) => this.logger.warn(`[${key}] ${args.join(' ')}`),
            error: (...args) => this.logger.error(`[${key}] ${args.join(' ')}`)
        };
        const sandbox = {
            console,
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,
            Date,
            Buffer,
            JSON,
            Math,
            Object,
            Array,
            String,
            Number,
            Boolean,
            Map,
            Set,
            Promise,
            Error,
            config,
            module: { exports: {} },
            exports: {},
            require: (moduleName) => {
                if (['uuid', 'crypto', 'lodash', 'jsonwebtoken'].includes(moduleName)) {
                    return require(moduleName);
                }
                throw new Error(`Module '${moduleName}' is not allowed in custom middleware`);
            }
        };
        return sandbox;
    }
    async createMiddlewareInstance(key, code, sandbox) {
        try {
            const script = new vm.Script(code, { filename: key });
            const context = vm.createContext(sandbox);
            script.runInContext(context, { timeout: 5000 });
            const moduleExports = sandbox.module.exports;
            if (typeof moduleExports === 'object' && typeof moduleExports.execute === 'function') {
                return moduleExports;
            }
            if (typeof sandbox.exports === 'object' && typeof sandbox.exports.execute === 'function') {
                return sandbox.exports;
            }
            if (typeof moduleExports === 'function') {
                try {
                    const instance = new moduleExports();
                    if (typeof instance.execute === 'function') {
                        return instance;
                    }
                }
                catch (e) {
                    this.logger.warn(`Failed to instantiate middleware class for '${key}': ${e.message}`);
                }
            }
            this.logger.warn(`Middleware '${key}' does not export a valid execute function`);
            return null;
        }
        catch (error) {
            this.logger.error(`Error creating middleware instance for '${key}': ${error.message}`);
            return null;
        }
    }
    async loadAllCustomMiddleware() {
        const result = new Map();
        try {
            const allMiddleware = await this.customMiddlewareRegistry.getAllMiddleware();
            for (const config of allMiddleware) {
                const { key } = config;
                const instance = await this.loadCustomMiddleware(key);
                if (instance) {
                    const priority = config.config?.priority || 100;
                    result.set(key, {
                        name: key,
                        priority,
                        enabled: true,
                        middlewareInstance: instance
                    });
                    this.logger.log(`Loaded custom middleware: ${key} (priority: ${priority})`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Error loading custom middleware: ${error.message}`);
        }
        return result;
    }
    clearCache(key) {
        if (key) {
            this.sandboxCache.delete(key);
            this.logger.log(`Cleared cache for middleware '${key}'`);
        }
        else {
            this.sandboxCache.clear();
            this.logger.log('Cleared entire middleware cache');
        }
    }
};
exports.DynamicMiddlewareLoader = DynamicMiddlewareLoader;
exports.DynamicMiddlewareLoader = DynamicMiddlewareLoader = DynamicMiddlewareLoader_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.ModuleRef,
        middleware_config_service_1.MiddlewareConfigService,
        custom_middleware_registry_service_1.CustomMiddlewareRegistry])
], DynamicMiddlewareLoader);
//# sourceMappingURL=dynamic-middleware-loader.service.js.map