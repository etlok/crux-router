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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const nest_winston_1 = require("nest-winston");
const redis_logger_service_1 = require("./redis-logger.service");
const uuid_1 = require("uuid");
let RouterService = class RouterService {
    redis;
    logger;
    redisLoggerService;
    constructor(redis, logger, redisLoggerService) {
        this.redis = redis;
        this.logger = logger;
        this.redisLoggerService = redisLoggerService;
    }
    async routeEvent(eventName, metadata) {
        await this.redisLoggerService.logRequest('router', eventName, { metadata });
        const workflowKey = `workflow:${eventName}`;
        const workflowRaw = await this.redis.get(workflowKey);
        if (!workflowRaw) {
            await this.redisLoggerService.logResponse('router', eventName, { error: `No workflow definition found for event: ${eventName}` });
            throw new Error(`No workflow definition found for event: ${eventName}`);
        }
        const workflowTemplate = JSON.parse(workflowRaw);
        const workflow_instance_id = `workflow_instance:${(0, uuid_1.v4)()}`;
        const request_id = `req-${(0, uuid_1.v4)()}`;
        workflowTemplate.data = {
            ...workflowTemplate.data,
            payload: metadata,
            workflow_instance_id,
            request_id
        };
        workflowTemplate.metadata = {
            ...workflowTemplate.metadata,
            start_time: new Date().toISOString(),
            end_time: "",
            status: "pending",
            current_step: workflowTemplate.definition.steps[0]?.step_instance_id || ""
        };
        for (const step of workflowTemplate.definition.steps) {
            const step_instance_id = step.step_instance_id || `step_instance:${(0, uuid_1.v4)()}`;
            step.step_instance_id = step_instance_id;
            const stepWorkflowKey = step.definition.workflow_key || step.definition.type || step.definition.class;
            const workflowDefKey = `workflow:${stepWorkflowKey}`;
            const workflowDefRaw = await this.redis.get(workflowDefKey);
            if (!workflowDefRaw) {
                this.logger.warn(`No workflow definition found for step: ${step_instance_id} (key: ${workflowDefKey})`);
                continue;
            }
            const workflowDef = JSON.parse(workflowDefRaw);
            const workers = workflowDef.workers;
            if (!workers || Object.keys(workers).length === 0) {
                this.logger.warn(`No workers defined for step: ${step_instance_id} (workflow: ${workflowDefKey})`);
                continue;
            }
            const eligibleWorkers = Object.entries(workers).map(([worker_id, details]) => ({
                worker_id,
                ...details
            }));
            const chosenWorker = eligibleWorkers.reduce((prev, curr) => prev.threads <= curr.threads ? prev : curr);
            step.data = {
                ...step.data,
                worker_instance_id: chosenWorker.instance_id,
                worker_id: chosenWorker.worker_id
            };
            await this.redis.hset(step_instance_id, 'definition', JSON.stringify(step.definition), 'data', JSON.stringify(step.data), 'metadata', JSON.stringify(step.metadata));
            const queueKey = `worker_instance:${chosenWorker.instance_id}:queue`;
            const queueItem = {
                workflow_instance_id,
                step_instance_id
            };
            await this.redis.lpush(queueKey, JSON.stringify(queueItem));
        }
        await this.redis.hset(workflow_instance_id, 'definition', JSON.stringify(workflowTemplate.definition), 'data', JSON.stringify(workflowTemplate.data), 'metadata', JSON.stringify(workflowTemplate.metadata));
        await this.redisLoggerService.logResponse('router', eventName, {
            workflow_instance_id,
            request_id
        });
        return {
            status: 'workflow_started',
            workflow_instance_id,
            request_id
        };
    }
};
exports.RouterService = RouterService;
exports.RouterService = RouterService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __param(1, (0, common_1.Inject)(nest_winston_1.WINSTON_MODULE_NEST_PROVIDER)),
    __metadata("design:paramtypes", [ioredis_1.default, Object, redis_logger_service_1.RedisLoggerService])
], RouterService);
//# sourceMappingURL=router.service.js.map