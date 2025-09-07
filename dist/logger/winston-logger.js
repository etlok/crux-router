"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.winstonLoggerOptions = void 0;
const nest_winston_1 = require("nest-winston");
const winston = require("winston");
exports.winstonLoggerOptions = {
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.timestamp(), nest_winston_1.utilities.format.nestLike('App', { prettyPrint: true })),
        }),
        new winston.transports.File({
            filename: 'logs/app.log',
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
    ],
};
//# sourceMappingURL=winston-logger.js.map