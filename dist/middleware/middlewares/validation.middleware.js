"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ValidationMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMiddleware = void 0;
const common_1 = require("@nestjs/common");
const base_middleware_1 = require("../base.middleware");
let ValidationMiddleware = ValidationMiddleware_1 = class ValidationMiddleware extends base_middleware_1.BaseMiddleware {
    logger = new common_1.Logger(ValidationMiddleware_1.name);
    schemas = {
        ping: {
            required: ['timestamp'],
            validate: (data) => typeof data.timestamp === 'number',
        },
        authenticate: {
            required: ['token'],
            validate: (data) => typeof data.token === 'string' && data.token.length > 0,
        },
        protected: {
            required: ['data'],
            validate: (data) => typeof data.data === 'string',
        },
    };
    async execute(context, next) {
        const { client, event, data } = context;
        if (!this.schemas[event]) {
            return next();
        }
        const schema = this.schemas[event];
        let isValid = true;
        let errorMessage = '';
        try {
            for (const field of schema.required) {
                if (data === undefined || data === null || data[field] === undefined) {
                    isValid = false;
                    errorMessage = `Missing required field: ${field}`;
                    break;
                }
            }
            if (isValid && schema.validate && !schema.validate(data)) {
                isValid = false;
                errorMessage = `Invalid data format for event: ${event}`;
            }
            if (!isValid) {
                this.logger.warn(`Validation error for ${event}: ${errorMessage}`);
                client.emit('error', {
                    code: 'VALIDATION_ERROR',
                    message: errorMessage,
                });
                context.metadata.validationError = errorMessage;
                context.metadata.isValid = false;
            }
            else {
                context.metadata.isValid = true;
            }
        }
        catch (error) {
            this.logger.error(`Error in validation middleware: ${error.message}`);
            context.metadata.validationError = error.message;
            context.metadata.isValid = false;
        }
        await next();
    }
};
exports.ValidationMiddleware = ValidationMiddleware;
exports.ValidationMiddleware = ValidationMiddleware = ValidationMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, base_middleware_1.Middleware)({ priority: 40 })
], ValidationMiddleware);
//# sourceMappingURL=validation.middleware.js.map