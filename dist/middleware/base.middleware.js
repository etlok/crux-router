"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMiddleware = void 0;
exports.Middleware = Middleware;
require("reflect-metadata");
class BaseMiddleware {
}
exports.BaseMiddleware = BaseMiddleware;
function Middleware(options = {}) {
    return (target) => {
        const { priority = 100, enabled = true } = options;
        Reflect.defineMetadata('middleware:priority', priority, target);
        Reflect.defineMetadata('middleware:enabled', enabled, target);
        return target;
    };
}
//# sourceMappingURL=base.middleware.js.map