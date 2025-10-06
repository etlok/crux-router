"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
const base_middleware_1 = require("../base.middleware");
let LoggingMiddleware = LoggingMiddleware_1 = class LoggingMiddleware extends base_middleware_1.BaseMiddleware {
    logger = new common_1.Logger(LoggingMiddleware_1.name);
    async execute(context, next) {
        const { client, event, data } = context;
        const startTime = Date.now();
        this.logger.log(`Event received: ${event} from ${client.id}`);
        try {
            await next();
            const duration = Date.now() - startTime;
            this.logger.debug(`Event ${event} processed in ${duration}ms`);
        }
        catch (error) {
            this.logger.error(`Error processing event ${event}: ${error.message}`);
            throw error;
        }
    }
};
exports.LoggingMiddleware = LoggingMiddleware;
exports.LoggingMiddleware = LoggingMiddleware = LoggingMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, base_middleware_1.Middleware)({ priority: 30 })
], LoggingMiddleware);
//# sourceMappingURL=logging.middleware.js.map