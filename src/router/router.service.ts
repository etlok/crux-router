import { forwardRef, Inject, Injectable, LoggerService } from '@nestjs/common';
import Redis from 'ioredis';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RedisLoggerService } from './redis-logger.service';
import { v4 as uuidv4 } from 'uuid';
import { WorkerLogEmitterService } from '../events/worker-log-emitter.service';

// Define interfaces for the worker instance structure
interface WorkerInstance {
  worker_id: string;
  instance_id: string;
  current_thread_count: number;
  thread_capacity: number;
  utilization: number;
}

@Injectable()
export class RouterService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly redisLoggerService: RedisLoggerService,
    @Inject(forwardRef(() => WorkerLogEmitterService))
    private readonly workerLogEmitterService: WorkerLogEmitterService,
  ) {}

  async routeEvent(workflowName: string, metadata?: any) {
    //await this.redisLoggerService.logRequest('router', workflowName, { metadata });

    // 1. Fetch the workflow definition from Redis
    const workflowKey = `workflow:${workflowName}`;
    const workflowRaw = await this.redis.get(workflowKey);

    if (!workflowRaw) {
      await this.redisLoggerService.logResponse('router', workflowName, {
        error: `No workflow definition found for: ${workflowName}`,
      });
      throw new Error(`No workflow definition found for: ${workflowName}`);
    }

    // 2. Parse the workflow definition
    const workflowDefinition = JSON.parse(workflowRaw);
    this.logger.log(
      `Found workflow definition for ${workflowName}: ${JSON.stringify(workflowDefinition)}`,
    );

    // 3. Generate new workflow_instance_id and request_id
    const workflow_instance_id = `workflow_instance:${uuidv4()}`;
    const request_id = `req-${uuidv4()}`;

    // 4. Get available workers for this workflow
    let workerIds: string[] = [];

    // Try to get workers from the hash first
    const workflowWorkers = await this.redis.hgetall(
      `workflow:${workflowName}:workers`,
    );
    if (workflowWorkers && Object.keys(workflowWorkers).length > 0) {
      workerIds = Object.keys(workflowWorkers);
      this.logger.log(
        `Found ${workerIds.length} workers from hash for workflow: ${workflowName}`,
      );
    } else {
      // If not found in hash, try the set
      workerIds = await this.redis.smembers(
        `workflow:${workflowName}:worker_list`,
      );
      if (workerIds && workerIds.length > 0) {
        this.logger.log(
          `Found ${workerIds.length} workers from set for workflow: ${workflowName}`,
        );
      } else {
        await this.redisLoggerService.logResponse('router', workflowName, {
          error: `No workers found for workflow: ${workflowName}`,
        });
        throw new Error(`No workers found for workflow: ${workflowName}`);
      }
    }

    this.logger.log(
      `Found ${workerIds.length} workers for workflow: ${workflowName}`,
    );

    // 5. Get worker instances and their details
    const workerInstances: WorkerInstance[] = [];

    for (const workerId of workerIds) {
      // Get all instances for this worker
      const instancesKey = `crux:component:${workerId}:instances`;
      const instanceIds = await this.redis.smembers(instancesKey);

      if (!instanceIds || instanceIds.length === 0) {
        this.logger.warn(`No instances found for worker: ${workerId}`);
        continue;
      }

      // Get details for each instance
      for (const instanceId of instanceIds) {
        const instanceDetails = await this.redis.hgetall(instanceId);

        if (instanceDetails && instanceDetails.status === 'online') {
          workerInstances.push({
            worker_id: workerId,
            instance_id: instanceId,
            current_thread_count: parseInt(
              instanceDetails.current_thread_count || '0',
              10,
            ),
            thread_capacity: parseInt(
              instanceDetails.thread_capacity || '1000',
              10,
            ),
            utilization:
              (parseInt(instanceDetails.current_thread_count || '0', 10) /
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
      throw new Error(
        `No active worker instances found for workflow: ${workflowName}`,
      );
    }

    // 6. Sort worker instances by utilization (lowest first)
    workerInstances.sort((a, b) => a.utilization - b.utilization);

    // Choose the worker instance with the lowest utilization
    const chosenWorker = workerInstances[0];
    const workerSelectedMsg = `Selected worker instance: ${chosenWorker.instance_id} (${chosenWorker.worker_id}) with utilization: ${chosenWorker.utilization}%`;
    this.logger.log(workerSelectedMsg);

    // Emit the worker selection event to connected clients
    this.workerLogEmitterService.emitWorkerLog(workerSelectedMsg);

    // 7. Create step instances for each step in the workflow
    const stepInstances: string[] = [];

    if (workflowDefinition.steps && workflowDefinition.steps.length > 0) {
      for (const step of workflowDefinition.steps) {
        const step_instance_id = `step_instance:${uuidv4()}`;

        // Create the step instance
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

        // Save step instance to Redis
        await this.redis.hset(
          step_instance_id,
          'definition',
          JSON.stringify(stepInstance.definition),
          'data',
          JSON.stringify(stepInstance.data),
          'metadata',
          JSON.stringify(stepInstance.metadata),
        );

        stepInstances.push(step_instance_id);

        // Add the step to the worker's queue
        const queueKey = `worker_instance:${chosenWorker.instance_id}:queue`;
        const queueItem = {
          workflow_instance_id,
          step_instance_id,
        };
        await this.redis.lpush(queueKey, JSON.stringify(queueItem));

        const stepAddedMsg = `Added step ${step_instance_id} to queue ${queueKey}`;
        this.logger.log(stepAddedMsg);

        // Emit the step added event to connected clients
        this.workerLogEmitterService.emitWorkerLog(stepAddedMsg);

        // Increment the worker's thread count
        await this.redis.hincrby(
          chosenWorker.instance_id,
          'current_thread_count',
          1,
        );
      }
    }

    // 8. Create the workflow instance with hooks
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

    // 9. Save the workflow instance
    await this.redis.hset(
      workflow_instance_id,
      'definition',
      JSON.stringify(workflowInstance.definition),
      'data',
      JSON.stringify(workflowInstance.data),
      'metadata',
      JSON.stringify(workflowInstance.metadata),
    );

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
}
