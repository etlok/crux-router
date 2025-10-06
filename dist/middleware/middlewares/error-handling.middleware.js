"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ErrorHandlingMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandlingMiddleware = void 0;
const common_1 = require("@nestjs/common");
const base_middleware_1 = require("../base.middleware");
let ErrorHandlingMiddleware = ErrorHandlingMiddleware_1 = class ErrorHandlingMiddleware extends base_middleware_1.BaseMiddleware {
    logger = new common_1.Logger(ErrorHandlingMiddleware_1.name);
    async execute(context, next) {
        try {
            context.metadata.errorHandling = {
                started: Date.now()
            };
            await next();
            context.metadata.errorHandling.status = 'success';
            context.metadata.errorHandling.completed = Date.now();
        }
        catch (error) {
            context.metadata.errorHandling.status = 'error';
            context.metadata.errorHandling.error = error;
            context.metadata.errorHandling.completed = Date.now();
            this.logger.error(`Error processing event ${context.event}: ${error.message}`);
            const errorResponse = {
                status: 'error',
                code: error.code || 'INTERNAL_ERROR',
                message: error.message || 'An unexpected error occurred',
                timestamp: new Date().toISOString(),
                requestId: this.generateRequestId()
            };
            context.client.emit('error', errorResponse);
            this.logger.debug(`Error details: ${JSON.stringify({
                event: context.event,
                clientId: context.client.id,
                error: errorResponse,
                data: context.data
            }, null, 2)}`);
        }
    }
    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.ErrorHandlingMiddleware = ErrorHandlingMiddleware;
exports.ErrorHandlingMiddleware = ErrorHandlingMiddleware = ErrorHandlingMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, base_middleware_1.Middleware)({ priority: 5 })
], ErrorHandlingMiddleware);
//# sourceMappingURL=error-handling.middleware.js.map