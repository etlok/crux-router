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
const worker_log_emitter_service_1 = require("../events/worker-log-emitter.service");
let RouterService = class RouterService {
    redis;
    logger;
    redisLoggerService;
    workerLogEmitterService;
    constructor(redis, logger, redisLoggerService, workerLogEmitterService) {
        this.redis = redis;
        this.logger = logger;
        this.redisLoggerService = redisLoggerService;
        this.workerLogEmitterService = workerLogEmitterService;
    }
    async routeEvent(workflowName, metadata) {
        const workflowKey = `workflow:${workflowName}`;
        const workflowRaw = await this.redis.get(workflowKey);
        if (!workflowRaw) {
            await this.redisLoggerService.logResponse('router', workflowName, {
                error: `No workflow definition found for: ${workflowName}`,
            });
            throw new Error(`No workflow definition found for: ${workflowName}`);
        }
        const workflowDefinition = JSON.parse(workflowRaw);
        this.logger.log(`Found workflow definition for ${workflowName}: ${JSON.stringify(workflowDefinition)}`);
        const workflow_instance_id = `workflow_instance:${(0, uuid_1.v4)()}`;
        const request_id = `req-${(0, uuid_1.v4)()}`;
        let workerIds = [];
        const workflowWorkers = await this.redis.hgetall(`workflow:${workflowName}:workers`);
        if (workflowWorkers && Object.keys(workflowWorkers).length > 0) {
            workerIds = Object.keys(workflowWorkers);
            this.logger.log(`Found ${workerIds.length} workers from hash for workflow: ${workflowName}`);
        }
        else {
            workerIds = await this.redis.smembers(`workflow:${workflowName}:worker_list`);
            if (workerIds && workerIds.length > 0) {
                this.logger.log(`Found ${workerIds.length} workers from set for workflow: ${workflowName}`);
            }
            else {
                await this.redisLoggerService.logResponse('router', workflowName, {
                    error: `No workers found for workflow: ${workflowName}`,
                });
                throw new Error(`No workers found for workflow: ${workflowName}`);
            }
        }
        this.logger.log(`Found ${workerIds.length} workers for workflow: ${workflowName}`);
        const workerInstances = [];
        for (const workerId of workerIds) {
            const instancesKey = `crux:component:${workerId}:instances`;
            const instanceIds = await this.redis.smembers(instancesKey);
            if (!instanceIds || instanceIds.length === 0) {
                this.logger.warn(`No instances found for worker: ${workerId}`);
                continue;
            }
            for (const instanceId of instanceIds) {
                const instanceDetails = await this.redis.hgetall(instanceId);
                if (instanceDetails && instanceDetails.status === 'online') {
                    workerInstances.push({
                        worker_id: workerId,
                        instance_id: instanceId,
                        current_thread_count: parseInt(instanceDetails.current_thread_count || '0', 10),
                        thread_capacity: parseInt(instanceDetails.thread_capacity || '1000', 10),
                        utilization: (parseInt(instanceDetails.current_thread_count || '0', 10) /
                            parseInt(instanceDetails.thread_capacity || '1000', 10)) *
                            100,
                    });
                }
            }
        }
        if (workerInstances.length === 0) {
            await this.redisLoggerService.logResponse('router', workflowName, {
                error: `No active worker instances found for workflow: ${workflowName}`,
            });
            throw new Error(`No active worker instances found for workflow: ${workflowName}`);
        }
        workerInstances.sort((a, b) => a.utilization - b.utilization);
        const chosenWorker = workerInstances[0];
        const workerSelectedMsg = `Selected worker instance: ${chosenWorker.instance_id} (${chosenWorker.worker_id}) with utilization: ${chosenWorker.utilization}%`;
        this.logger.log(workerSelectedMsg);
        this.workerLogEmitterService.emitWorkerLog(workerSelectedMsg);
        const stepInstances = [];
        if (workflowDefinition.steps && workflowDefinition.steps.length > 0) {
            for (const step of workflowDefinition.steps) {
                const step_instance_id = `step_instance:${(0, uuid_1.v4)()}`;
                const stepInstance = {
                    definition: {
                        type: step.type,
                        class: step.class,
                    },
                    data: {
                        workflow_instance_id,
                        worker_id: chosenWorker.worker_id,
                        worker_instance_id: chosenWorker.instance_id,
                        config: metadata?.config || {},
                        metadata: metadata || {},
                    },
                    metadata: {
                        start_time: '',
                        end_time: '',
                        status: 'pending',
                    },
                };
                await this.redis.hset(step_instance_id, 'definition', JSON.stringify(stepInstance.definition), 'data', JSON.stringify(stepInstance.data), 'metadata', JSON.stringify(stepInstance.metadata));
                stepInstances.push(step_instance_id);
                const queueKey = `worker_instance:${chosenWorker.instance_id}:queue`;
                const queueItem = {
                    workflow_instance_id,
                    step_instance_id,
                };
                await this.redis.lpush(queueKey, JSON.stringify(queueItem));
                const stepAddedMsg = `Added step ${step_instance_id} to queue ${queueKey}`;
                this.logger.log(stepAddedMsg);
                this.workerLogEmitterService.emitWorkerLog(stepAddedMsg);
                await this.redis.hincrby(chosenWorker.instance_id, 'current_thread_count', 1);
            }
        }
        const workflowInstance = {
            definition: {
                hooks: workflowDefinition.hooks || {
                    on_start: {},
                    on_complete: {},
                    on_failure: {},
                },
                steps: stepInstances,
            },
            data: {
                workflow: workflowName,
                payload: metadata || {},
                workflow_instance_id,
                request_id,
            },
            metadata: {
                start_time: new Date().toISOString(),
                end_time: '',
                status: 'pending',
                current_step: stepInstances[0] || '',
            },
        };
        await this.redis.hset(workflow_instance_id, 'definition', JSON.stringify(workflowInstance.definition), 'data', JSON.stringify(workflowInstance.data), 'metadata', JSON.stringify(workflowInstance.metadata));
        await this.redisLoggerService.logResponse('router', workflowName, {
            workflow_instance_id,
            request_id,
            steps: stepInstances,
            worker: {
                id: chosenWorker.worker_id,
                instance: chosenWorker.instance_id,
                utilization: chosenWorker.utilization,
            },
        });
        return {
            status: 'workflow_started',
            workflow_instance_id,
            request_id,
            steps: stepInstances,
        };
    }
};
exports.RouterService = RouterService;
exports.RouterService = RouterService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __param(1, (0, common_1.Inject)(nest_winston_1.WINSTON_MODULE_NEST_PROVIDER)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => worker_log_emitter_service_1.WorkerLogEmitterService))),
    __metadata("design:paramtypes", [ioredis_1.default, Object, redis_logger_service_1.RedisLoggerService,
        worker_log_emitter_service_1.WorkerLogEmitterService])
], RouterService);
//# sourceMappingURL=router.service.js.map