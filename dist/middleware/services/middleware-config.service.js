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
var MiddlewareConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareConfigService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const promises_1 = require("fs/promises");
const path = require("path");
const middleware_config_interface_1 = require("../interfaces/middleware-config.interface");
let MiddlewareConfigService = MiddlewareConfigService_1 = class MiddlewareConfigService {
    redisService;
    logger = new common_1.Logger(MiddlewareConfigService_1.name);
    constructor(redisService) {
        this.redisService = redisService;
    }
    async onModuleInit() {
        try {
            await this.loadConfigFromFileToRedis();
            this.logger.log('Middleware configurations loaded successfully');
        }
        catch (error) {
            this.logger.error(`Failed to load middleware configurations: ${error.message}`);
        }
    }
    async loadConfigFromFileToRedis(configPath) {
        const filePath = configPath || path.join(process.cwd(), 'middleware.json');
        try {
            const fileContent = await (0, promises_1.readFile)(filePath, 'utf-8');
            const configs = JSON.parse(fileContent);
            const redisClient = await this.redisService.getPubClient();
            await redisClient.del(middleware_config_interface_1.REDIS_MIDDLEWARE_KEYS.CONFIG_LIST);
            const existingKeys = await redisClient.keys(`${middleware_config_interface_1.REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX}*`);
            if (existingKeys.length > 0) {
                await redisClient.del(existingKeys);
            }
            for (const config of configs) {
                await redisClient.sAdd(middleware_config_interface_1.REDIS_MIDDLEWARE_KEYS.CONFIG_LIST, config.key);
                await redisClient.set(`${middleware_config_interface_1.REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX}${config.key}`, JSON.stringify(config));
            }
            this.logger.log(`Loaded ${configs.length} middleware configurations to Redis`);
        }
        catch (error) {
            this.logger.error(`Error loading middleware configurations: ${error.message}`);
            throw error;
        }
    }
    async getAllConfigs() {
        try {
            const redisClient = await this.redisService.getPubClient();
            const configs = [];
            const keysPattern = 'middleware:config:*';
            const keys = await redisClient.keys(keysPattern);
            if (!keys || keys.length === 0) {
                this.logger.warn('No middleware configurations found in Redis');
                return [];
            }
            this.logger.log(`Found ${keys.length} middleware configurations in Redis`);
            for (const fullKey of keys) {
                const key = fullKey.split(':').pop() || '';
                try {
                    const hash = await redisClient.hGetAll(fullKey);
                    if (hash && hash.type) {
                        if (hash.type === 'class') {
                            const classConfig = {
                                key: key,
                                type: 'class',
                                path: hash.path || '',
                                config: hash.config ? JSON.parse(hash.config) : {},
                            };
                            configs.push(classConfig);
                        }
                        else if (hash.type === 'group') {
                            const groupConfig = {
                                key: key,
                                type: 'group',
                                keys: hash.keys ? JSON.parse(hash.keys) : [],
                            };
                            configs.push(groupConfig);
                        }
                    }
                }
                catch (error) {
                    this.logger.error(`Error parsing middleware config for ${key}: ${error.message}`);
                }
            }
            return configs;
        }
        catch (error) {
            this.logger.error(`Error getting middleware configurations: ${error.message}`);
            return [];
        }
    }
    async getConfigByKey(key) {
        try {
            const redisClient = await this.redisService.getPubClient();
            const configJson = await redisClient.get(`${middleware_config_interface_1.REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX}${key}`);
            return configJson ? JSON.parse(configJson) : null;
        }
        catch (error) {
            this.logger.error(`Error getting middleware configuration for key ${key}: ${error.message}`);
            return null;
        }
    }
    async setActiveMiddleware(keys) {
        try {
            const redisClient = await this.redisService.getPubClient();
            await redisClient.del(middleware_config_interface_1.REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE);
            await redisClient.del('middleware:active');
            await redisClient.set(middleware_config_interface_1.REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE, JSON.stringify(keys));
            this.logger.log(`Set active middleware keys: ${keys.join(', ')}`);
        }
        catch (error) {
            this.logger.error(`Error setting active middleware: ${error.message}`);
            throw error;
        }
    }
    async getActiveMiddleware() {
        try {
            const redisClient = await this.redisService.getPubClient();
            const activeJson = await redisClient.get(middleware_config_interface_1.REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE);
            if (activeJson) {
                try {
                    const parsed = JSON.parse(activeJson);
                    if (Array.isArray(parsed)) {
                        this.logger.log(`Found active middleware: ${parsed.join(', ')}`);
                        return parsed;
                    }
                    else {
                        this.logger.warn('Active middleware is not an array, using empty array');
                    }
                }
                catch (jsonError) {
                    this.logger.error(`Error parsing active middleware JSON: ${jsonError.message}`);
                }
            }
            this.logger.warn('No active middleware found in Redis');
            return [];
        }
        catch (error) {
            this.logger.error(`Error getting active middleware: ${error.message}`);
            return [];
        }
    }
    async resolveMiddlewareKeys(keys) {
        const resolved = new Set();
        const visited = new Set();
        const resolveKey = async (key) => {
            if (visited.has(key)) {
                return;
            }
            visited.add(key);
            const config = await this.getConfigByKey(key);
            if (!config) {
                resolved.add(key);
                return;
            }
            if (config.type === 'class') {
                resolved.add(key);
            }
            else if (config.type === 'group') {
                for (const subKey of config.keys) {
                    await resolveKey(subKey);
                }
            }
        };
        for (const key of keys) {
            await resolveKey(key);
        }
        return Array.from(resolved);
    }
};
exports.MiddlewareConfigService = MiddlewareConfigService;
exports.MiddlewareConfigService = MiddlewareConfigService = MiddlewareConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], MiddlewareConfigService);
//# sourceMappingURL=middleware-config.service.js.map