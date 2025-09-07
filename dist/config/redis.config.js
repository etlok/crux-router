"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('redis', () => ({
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    host: process.env.REDIS_HOST || '127.0.0.1',
}));
//# sourceMappingURL=redis.config.js.map