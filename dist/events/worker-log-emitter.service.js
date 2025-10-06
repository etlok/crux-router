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
var WorkerLogEmitterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerLogEmitterService = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let WorkerLogEmitterService = WorkerLogEmitterService_1 = class WorkerLogEmitterService {
    server;
    logger = new common_1.Logger(WorkerLogEmitterService_1.name);
    emitWorkerLog(logMessage) {
        try {
            if (!this.server) {
                return;
            }
            if (logMessage.includes('Selected worker instance:') && logMessage.includes('with utilization:')) {
                const workerMatch = logMessage.match(/Selected worker instance: ([^ ]+) \(([^)]+)\) with utilization: ([0-9.]+)%/);
                if (workerMatch) {
                    const workerId = workerMatch[1];
                    const workerName = workerMatch[2];
                    const utilization = workerMatch[3];
                    this.server.emit('worker_log', {
                        type: 'worker_selected',
                        message: logMessage,
                        workerId,
                        workerName,
                        utilization
                    });
                    this.logger.debug(`Emitted worker selection event: ${workerName} (${utilization}%)`);
                }
            }
            else if (logMessage.includes('Added step step_instance:') && logMessage.includes('to queue worker_instance:')) {
                const stepMatch = logMessage.match(/Added step (step_instance:[a-z0-9-]+) to queue (worker_instance:[^:]+:[^:]+:[^:]+)/);
                if (stepMatch) {
                    const stepInstanceId = stepMatch[1];
                    const workerInstanceId = stepMatch[2];
                    this.server.emit('worker_log', {
                        type: 'step_added',
                        message: logMessage,
                        stepInstanceId,
                        workerInstanceId
                    });
                    this.logger.debug(`Emitted step added to queue event: ${stepInstanceId}`);
                }
            }
            else if (logMessage.includes('step_instance:') ||
                logMessage.includes('worker_instance:') ||
                logMessage.includes('workflow:')) {
                this.server.emit('worker_log', {
                    type: 'workflow_log',
                    message: logMessage
                });
            }
        }
        catch (error) {
            this.logger.error(`Error emitting worker log: ${error.message}`);
        }
    }
    setServer(server) {
        this.server = server;
    }
};
exports.WorkerLogEmitterService = WorkerLogEmitterService;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WorkerLogEmitterService.prototype, "server", void 0);
exports.WorkerLogEmitterService = WorkerLogEmitterService = WorkerLogEmitterService_1 = __decorate([
    (0, common_1.Injectable)()
], WorkerLogEmitterService);
//# sourceMappingURL=worker-log-emitter.service.js.map