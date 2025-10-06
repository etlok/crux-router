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
var MiddlewareVisualizerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareVisualizerService = void 0;
const common_1 = require("@nestjs/common");
const middleware_loader_service_1 = require("./middleware-loader.service");
let MiddlewareVisualizerService = MiddlewareVisualizerService_1 = class MiddlewareVisualizerService {
    middlewareLoader;
    logger = new common_1.Logger(MiddlewareVisualizerService_1.name);
    constructor(middlewareLoader) {
        this.middlewareLoader = middlewareLoader;
    }
    visualizeMiddlewareChain() {
        const middlewares = this.middlewareLoader.getMiddlewares();
        if (middlewares.length === 0) {
            return 'No middleware registered';
        }
        let output = '\n=== MIDDLEWARE EXECUTION CHAIN ===\n\n';
        const enabledMiddlewares = middlewares
            .filter(m => m.enabled)
            .sort((a, b) => a.priority - b.priority);
        const disabledMiddlewares = middlewares
            .filter(m => !m.enabled)
            .sort((a, b) => a.priority - b.priority);
        output += 'EXECUTION ORDER:\n';
        enabledMiddlewares.forEach((middleware, index) => {
            output += `${index + 1}. [${middleware.priority}] ${middleware.name}\n`;
            if (index < enabledMiddlewares.length - 1) {
                output += '   |\n   ▼\n';
            }
        });
        if (disabledMiddlewares.length > 0) {
            output += '\nDISABLED MIDDLEWARE:\n';
            disabledMiddlewares.forEach((middleware) => {
                output += `• [${middleware.priority}] ${middleware.name}\n`;
            });
        }
        output += '\n=================================\n';
        return output;
    }
    logMiddlewareChain() {
        const visualization = this.visualizeMiddlewareChain();
        console.log(visualization);
    }
    getMiddlewareStatistics() {
        const middlewares = this.middlewareLoader.getMiddlewares();
        return {
            total: middlewares.length,
            enabled: middlewares.filter(m => m.enabled).length,
            disabled: middlewares.filter(m => !m.enabled).length,
            byPriority: this.countByPriority(middlewares),
            averagePriority: this.calculateAveragePriority(middlewares)
        };
    }
    countByPriority(middlewares) {
        const ranges = {
            'critical (0-10)': 0,
            'high (11-30)': 0,
            'medium (31-50)': 0,
            'low (51-100)': 0,
            'lowest (>100)': 0
        };
        middlewares.forEach(middleware => {
            const priority = middleware.priority;
            if (priority <= 10)
                ranges['critical (0-10)']++;
            else if (priority <= 30)
                ranges['high (11-30)']++;
            else if (priority <= 50)
                ranges['medium (31-50)']++;
            else if (priority <= 100)
                ranges['low (51-100)']++;
            else
                ranges['lowest (>100)']++;
        });
        return ranges;
    }
    calculateAveragePriority(middlewares) {
        if (middlewares.length === 0)
            return 0;
        const sum = middlewares.reduce((acc, middleware) => acc + middleware.priority, 0);
        return Math.round(sum / middlewares.length);
    }
};
exports.MiddlewareVisualizerService = MiddlewareVisualizerService;
exports.MiddlewareVisualizerService = MiddlewareVisualizerService = MiddlewareVisualizerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [middleware_loader_service_1.MiddlewareLoaderService])
], MiddlewareVisualizerService);
//# sourceMappingURL=middleware-visualizer.service.js.map