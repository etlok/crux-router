"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsModule = void 0;
const common_1 = require("@nestjs/common");
const event_processor_service_1 = require("./event-processor.service");
const middleware_module_1 = require("../middleware/middleware.module");
const router_module_1 = require("../router/router.module");
const worker_log_emitter_service_1 = require("./worker-log-emitter.service");
let EventsModule = class EventsModule {
};
exports.EventsModule = EventsModule;
exports.EventsModule = EventsModule = __decorate([
    (0, common_1.Module)({
        imports: [middleware_module_1.MiddlewareModule, (0, common_1.forwardRef)(() => router_module_1.RouterModule)],
        providers: [event_processor_service_1.EventProcessorService, worker_log_emitter_service_1.WorkerLogEmitterService],
        exports: [event_processor_service_1.EventProcessorService, worker_log_emitter_service_1.WorkerLogEmitterService],
    })
], EventsModule);
//# sourceMappingURL=events.module.js.map