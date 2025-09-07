"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('redis', () => ({
    enableKafka: process.env.ENABLE_KAFKA,
    brokers: ['localhost:9092'],
    clientId: 'nestjs-pubsub',
}));
//# sourceMappingURL=kafka.config.js.map