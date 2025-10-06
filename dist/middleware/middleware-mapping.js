"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewareSets = exports.middlewareClassMap = void 0;
const authentication_middleware_1 = require("./middlewares/authentication.middleware");
const logging_middleware_1 = require("./middlewares/logging.middleware");
const error_handling_middleware_1 = require("./middlewares/error-handling.middleware");
exports.middlewareClassMap = {
    auth: authentication_middleware_1.AuthenticationMiddleware,
    log: logging_middleware_1.LoggingMiddleware,
    errorHandling: error_handling_middleware_1.ErrorHandlingMiddleware,
};
exports.middlewareSets = {
    standard: ['auth', 'log'],
};
//# sourceMappingURL=middleware-mapping.js.map