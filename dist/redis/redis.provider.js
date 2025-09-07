"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisProvider = void 0;
const ioredis_1 = require("ioredis");
const config_1 = require("@nestjs/config");
exports.RedisProvider = {
    provide: 'REDIS_CLIENT',
    inject: [config_1.ConfigService],
    useFactory: async (configService) => {
        const port = configService.get('redis.port');
        const host = configService.get('redis.host');
        const client = new ioredis_1.default({ port, host });
        client.on('connect', () => console.log('Redis connected'));
        client.on('error', (err) => console.error('Redis error', err));
        return client;
    },
};
//# sourceMappingURL=redis.provider.js.map