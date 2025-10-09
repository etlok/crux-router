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
var CustomMiddlewareRegistry_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomMiddlewareRegistry = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const common_2 = require("@nestjs/common");
const fs = require("fs/promises");
const path = require("path");
const uuid_1 = require("uuid");
let CustomMiddlewareRegistry = CustomMiddlewareRegistry_1 = class CustomMiddlewareRegistry {
    redis;
    logger = new common_1.Logger(CustomMiddlewareRegistry_1.name);
    middlewareDir = path.join(process.cwd(), 'custom-middleware');
    constructor(redis) {
        this.redis = redis;
        this.ensureMiddlewareDir();
    }
    async ensureMiddlewareDir() {
        try {
            await fs.mkdir(this.middlewareDir, { recursive: true });
        }
        catch (error) {
            this.logger.error(`Error creating middleware directory: ${error.message}`);
        }
    }
    async registerMiddleware(key, code, config = {}, metadata = {}) {
        if (!/^[a-z0-9-]+$/.test(key)) {
            throw new Error('Invalid middleware key: must be lowercase alphanumeric with dashes only');
        }
        const exists = await this.redis.exists(`middleware:${key}`);
        if (exists) {
            throw new Error(`Middleware with key '${key}' already exists`);
        }
        const middlewareId = `middleware-${(0, uuid_1.v4)()}`;
        try {
            const filename = `${key}-${Date.now()}.js`;
            const filePath = path.join(this.middlewareDir, filename);
            await fs.writeFile(filePath, code, 'utf8');
            const middlewareConfig = {
                id: middlewareId,
                key,
                type: 'custom',
                path: filePath,
                config,
                metadata: {
                    ...metadata,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            };
            await this.redis.set(`middleware:${key}`, JSON.stringify(middlewareConfig));
            await this.redis.sadd('middleware:available', key);
            this.logger.log(`Registered custom middleware: ${key} (${middlewareId})`);
            return middlewareId;
        }
        catch (error) {
            this.logger.error(`Error registering middleware '${key}': ${error.message}`);
            throw new Error(`Failed to register middleware: ${error.message}`);
        }
    }
    async updateMiddleware(key, code, config, metadata) {
        const configStr = await this.redis.get(`middleware:${key}`);
        if (!configStr) {
            throw new Error(`Middleware '${key}' not found`);
        }
        try {
            const middlewareConfig = JSON.parse(configStr);
            if (code) {
                const filename = `${key}-${Date.now()}.js`;
                const filePath = path.join(this.middlewareDir, filename);
                await fs.writeFile(filePath, code, 'utf8');
                middlewareConfig.path = filePath;
            }
            if (config) {
                middlewareConfig.config = {
                    ...middlewareConfig.config,
                    ...config,
                };
            }
            if (metadata) {
                middlewareConfig.metadata = {
                    ...middlewareConfig.metadata,
                    ...metadata,
                    updatedAt: new Date().toISOString(),
                };
            }
            await this.redis.set(`middleware:${key}`, JSON.stringify(middlewareConfig));
            this.logger.log(`Updated custom middleware: ${key}`);
        }
        catch (error) {
            this.logger.error(`Error updating middleware '${key}': ${error.message}`);
            throw new Error(`Failed to update middleware: ${error.message}`);
        }
    }
    async deleteMiddleware(key) {
        const configStr = await this.redis.get(`middleware:${key}`);
        if (!configStr) {
            throw new Error(`Middleware '${key}' not found`);
        }
        try {
            const middlewareConfig = JSON.parse(configStr);
            if (middlewareConfig.path) {
                try {
                    await fs.unlink(middlewareConfig.path);
                }
                catch (err) {
                    this.logger.warn(`Could not delete middleware file ${middlewareConfig.path}: ${err.message}`);
                }
            }
            await this.redis.del(`middleware:${key}`);
            await this.redis.srem('middleware:available', key);
            this.logger.log(`Deleted custom middleware: ${key}`);
        }
        catch (error) {
            this.logger.error(`Error deleting middleware '${key}': ${error.message}`);
            throw new Error(`Failed to delete middleware: ${error.message}`);
        }
    }
    async getAllMiddleware() {
        const keys = await this.redis.smembers('middleware:available');
        const result = [];
        for (const key of keys) {
            const configStr = await this.redis.get(`middleware:${key}`);
            if (configStr) {
                try {
                    const config = JSON.parse(configStr);
                    result.push(config);
                }
                catch (err) {
                    this.logger.warn(`Error parsing middleware config for '${key}': ${err.message}`);
                }
            }
        }
        return result;
    }
    async getMiddleware(key) {
        const configStr = await this.redis.get(`middleware:${key}`);
        if (!configStr) {
            return null;
        }
        try {
            return JSON.parse(configStr);
        }
        catch (err) {
            this.logger.warn(`Error parsing middleware config for '${key}': ${err.message}`);
            return null;
        }
    }
};
exports.CustomMiddlewareRegistry = CustomMiddlewareRegistry;
exports.CustomMiddlewareRegistry = CustomMiddlewareRegistry = CustomMiddlewareRegistry_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.default])
], CustomMiddlewareRegistry);
//# sourceMappingURL=custom-middleware-registry.service.js.map