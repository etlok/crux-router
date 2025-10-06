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
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly redisLoggerService: RedisLoggerService,
    @Inject(forwardRef(() => WorkerLogEmitterService))
    private readonly workerLogEmitterService: WorkerLogEmitterService
  ) {}

  // async routeEvent(eventName: string, metadata?: any) {
  //   await this.redisLoggerService.logRequest('router', eventName, { metadata });

  //   // 1. Fetch the event outcome config
  //   const eventKey = `event:${eventName}`;
  //   const outcomeRaw = await this.redis.get(eventKey);

  //   if (!outcomeRaw) {
  //     await this.redisLoggerService.logResponse('router', eventName, { error: `No outcome config found for event: ${eventName}` });
  //     throw new Error(`No outcome config found for event: ${eventName}`);
  //   }

  //   const eventConfig = JSON.parse(outcomeRaw);
  //   const { outcome } = eventConfig;

  //   if (!outcome || outcome.length === 0) {
  //     await this.redisLoggerService.logResponse('router', eventName, { error: 'No outcomes defined in event config' });
  //     throw new Error('No outcomes defined in event config');
  //   }

  //   // 2. Process each outcome
  //   const results: any[] = [];
  //   for (const outcomeConfig of outcome) {
  //     const { workflow, workflow_id, type, outcome_id, config } = outcomeConfig;


  //     // 3. Fetch workflow details (with embedded workers)
  //     const workflowKey = `workflow:${workflow}`;
  //     const workflowRaw = await this.redis.get(workflowKey);

  //     if (!workflowRaw) {
  //       await this.redisLoggerService.logResponse('router', eventName, { error: `No workflow config found for: ${workflow}` });
  //       throw new Error(`No workflow config found for: ${workflow}`);
  //     }

  //     const workflowConfig = JSON.parse(workflowRaw);
  //     const { workers } = workflowConfig;

  //     if (!workers || Object.keys(workers).length === 0) {
  //       await this.redisLoggerService.logResponse('router', eventName, { error: 'No workers defined in workflow config' });
  //       throw new Error('No workers defined in workflow config');
  //     }

  //     // 4. Convert workers object to array of eligible workers with their IDs
  //     const eligibleWorkers = Object.entries(workers).map(([worker_id, details]) => ({
  //       worker_id,
  //       ...details as any
  //     }));

  //     if (eligibleWorkers.length === 0) {
  //       await this.redisLoggerService.logResponse('router', eventName, { error: 'No eligible workers found in workflow config' });
  //       throw new Error('No eligible workers found in workflow config');
  //     }

  //     // 5. Select worker with lowest thread count
  //     const chosenWorker = eligibleWorkers.reduce((prev, curr) =>
  //       prev.threads <= curr.threads ? prev : curr
  //     );

  //     this.logger.log(`Chosen worker: ${JSON.stringify(chosenWorker)}`, RouterService.name);

  //     // 6. Prepare task payload
  //     const taskPayload = {
  //       event: eventName,
  //       workflow,
  //       workflow_id,
  //       outcome_id,
  //       outcome_type: type,
  //       config: typeof config === 'object' ? config : {},
  //       metadata: metadata || {},
  //       worker_id: chosenWorker.worker_id,
  //       worker_instance_id: chosenWorker.instance_id,
  //       timestamp: new Date().toISOString()
  //     };

  //     // 7. Push task to Redis
  //     const taskId = `task:${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  //     await this.redis.set(taskId, JSON.stringify(taskPayload));
  //     await this.redis.lpush('task_queue', taskId);

  //     this.logger.log(`Task pushed to queue: ${taskId}`, RouterService.name);

  //     // Log the workflow assignment and payload in Redis
  //     await this.redisLoggerService.logResponse('router', eventName, {
  //       assignedWorker: chosenWorker,
  //       outcome_id,
  //       workflow,
  //       workflow_id,
  //       taskPayload,
  //       taskId,
  //     });

  //     results.push({
  //       status: 'assigned',
  //       task_id: taskId,
  //       worker_id: chosenWorker.worker_id,
  //       instance_id: chosenWorker.instance_id,
  //       outcome_id
  //     });
  //   }

  //   return {
  //     status: 'routed',
  //     tasks: results
  //   };
  // }




//   async routeEvent(eventName: string, metadata?: any) {
//     await this.redisLoggerService.logRequest('router', eventName, { metadata });

//     // 1. Fetch the event outcome config
//     const eventKey = `event:${eventName}`;
//     const outcomeRaw = await this.redis.get(eventKey);

//     if (!outcomeRaw) {
//       await this.redisLoggerService.logResponse('router', eventName, { error: `No outcome config found for event: ${eventName}` });
//       throw new Error(`No outcome config found for event: ${eventName}`);
//     }

//     const eventConfig = JSON.parse(outcomeRaw);
//     const { outcome } = eventConfig;

//     if (!outcome || outcome.length === 0) {
//       await this.redisLoggerService.logResponse('router', eventName, { error: 'No outcomes defined in event config' });
//       throw new Error('No outcomes defined in event config');
//     }

//     // 2. Process each outcome
//     const results: any[] = [];
//     for (const outcomeConfig of outcome) {
//       const { workflow, workflow_id, type, outcome_id, config } = outcomeConfig;

//       // 3. worker with the lowest thread count using Redis sorted set
//       const zsetKey = `workflow:${workflow}:workers`;
//       const [worker_id] = await this.redis.zrange(zsetKey, 0, 0);
// console.log(worker_id,  'worker info');
//       if (!worker_id) {
//         await this.redisLoggerService.logResponse('router', eventName, { error: `No eligible workers found for workflow: ${workflow}` });
//         throw new Error(`No eligible workers found for workflow: ${workflow}`);
//       }

//       // 4. worker details from hash
//       const workerDetails = await this.redis.hgetall(`worker:${worker_id}`);
//       if (!workerDetails || !workerDetails.instance_id) {
//         await this.redisLoggerService.logResponse('router', eventName, { error: `Worker details not found for: ${worker_id}` });
//         throw new Error(`Worker details not found for: ${worker_id}`);
//       }

//       // 5. Increment the worker's thread count in the sorted set
//       await this.redis.zincrby(zsetKey, 1, worker_id);

//       this.logger.log(`Chosen worker: ${worker_id} (${JSON.stringify(workerDetails)})`, RouterService.name);

//       // 6. Prepare task payload
//       const taskPayload = {
//         event: eventName,
//         workflow,
//         workflow_id,
//         outcome_id,
//         outcome_type: type,
//         config: typeof config === 'object' ? config : {},
//         metadata: metadata || {},
//         worker_id,
//         worker_instance_id: workerDetails.instance_id,
//         timestamp: new Date().toISOString()
//       };

//       // 7. Push task to Redis
//       const taskId = `task:${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
//       await this.redis.set(taskId, JSON.stringify(taskPayload));
//       await this.redis.lpush('task_queue', taskId);

//       this.logger.log(`Task pushed to queue: ${taskId}`, RouterService.name);

//       // Log the workflow assignment and payload in Redis
//       await this.redisLoggerService.logResponse('router', eventName, {
//         assignedWorker: { worker_id, ...workerDetails },
//         outcome_id,
//         workflow,
//         workflow_id,
//         taskPayload,
//         taskId,
//       });

//       results.push({
//         status: 'assigned',
//         task_id: taskId,
//         worker_id,
//         instance_id: workerDetails.instance_id,
//         outcome_id
//       });
//     }

//     return {
//       status: 'routed',
//       tasks: results
//     };
//   }



// async routeEvent(eventName: string, metadata?: any) {
//   await this.redisLoggerService.logRequest('router', eventName, { metadata });

//   // 1. Fetch the event outcome config
//   const eventKey = `event:${eventName}`;
//   const outcomeRaw = await this.redis.get(eventKey);

//   if (!outcomeRaw) {
//     await this.redisLoggerService.logResponse('router', eventName, { error: `No outcome config found for event: ${eventName}` });
//     throw new Error(`No outcome config found for event: ${eventName}`);
//   }

//   const eventConfig = JSON.parse(outcomeRaw);
//   const { outcome } = eventConfig;

//   if (!outcome || outcome.length === 0) {
//     await this.redisLoggerService.logResponse('router', eventName, { error: 'No outcomes defined in event config' });
//     throw new Error('No outcomes defined in event config');
//   }

//   // 2. Prepare workflow and step instances
//   const workflow_instance_id = `workflow_instance:${uuidv4()}`;
//   const request_id = `req-${uuidv4()}`;
//   const steps: string[] = [];
//   let firstStepInstanceId = '';

//   for (const outcomeConfig of outcome) {
//     const { workflow, workflow_id, type, outcome_id, config } = outcomeConfig;

//     // 3. Find worker with the lowest thread count using Redis sorted set
//     const zsetKey = `workflow:${workflow}:workers`;
//     const [worker_id] = await this.redis.zrange(zsetKey, 0, 0);

//     if (!worker_id) {
//       await this.redisLoggerService.logResponse('router', eventName, { error: `No eligible workers found for workflow: ${workflow}` });
//       throw new Error(`No eligible workers found for workflow: ${workflow}`);
//     }

//     // 4. Getting worker details from hash
//     const workerDetails = await this.redis.hgetall(`worker:${worker_id}`);
//     if (!workerDetails || !workerDetails.instance_id) {
//       await this.redisLoggerService.logResponse('router', eventName, { error: `Worker details not found for: ${worker_id}` });
//       throw new Error(`Worker details not found for: ${worker_id}`);
//     }

//     // 5. Increment the worker's thread count in the sorted set
//     await this.redis.zincrby(zsetKey, 1, worker_id);

//     // 6. Create step instance
//     const step_instance_id = `step_instance:${uuidv4()}`;
//     if (!firstStepInstanceId) firstStepInstanceId = step_instance_id;
//     steps.push(step_instance_id);

//     const stepJson = {
//       definition: {
//         class: type, 
//         type,
//         steps: []
//       },
//       data: {
//         config: typeof config === 'object' ? config : {},
//         metadata: metadata || {},
//         // workflow_instance_id,
//         // outcome_id,
//         // worker_id,
//         // worker_instance_id: workerDetails.instance_id
//       },
//       metadata: {
//         start_time: "",
//         end_time: "",
//         status: "pending"
//       }
//     };

//     console.log(stepJson, 'steps info')
//     await this.redis.set(step_instance_id, JSON.stringify(stepJson));

//     // 7. Push step to worker's queue
//     const queueKey = `worker_instance:${workerDetails.instance_id}:queue`;
//     console.log(queueKey, 'queue key')
//     const queueItem = {
//       workflow_instance_id,
//       step: type,
//       step_instance_id
//     };
//     await this.redis.lpush(queueKey, JSON.stringify(queueItem));
//   }

//   // 8. Store steps list for workflow instance
//   await this.redis.set(`${workflow_instance_id}:steps`, JSON.stringify(steps));

//   // 9. Store workflow instance
//   const workflowInstance = {
//     definition: {
//       hooks: {
//         on_start: "",
//         on_complete: "",
//         on_failure: ""
//       },
//       steps
//     },
//     data: {
//       payload: metadata,
//       workflow_instance_id,
//       request_id
//     },
//     metadata: {
//       start_time: new Date().toISOString(),
//       end_time: "",
//       status: "pending",
//       current_step: firstStepInstanceId
//     }
//   };
//   await this.redis.set(workflow_instance_id, JSON.stringify(workflowInstance));

//   await this.redisLoggerService.logResponse('router', eventName, {
//     workflow_instance_id,
//     steps,
//     request_id
//   });

//   return {
//     status: 'workflow_started',
//     workflow_instance_id,
//     steps,
//     request_id
//   };
// }




async routeEvent(workflowName: string, metadata?: any) {
  //await this.redisLoggerService.logRequest('router', workflowName, { metadata });

  // 1. Fetch the workflow definition from Redis
  const workflowKey = `workflow:${workflowName}`;
  const workflowRaw = await this.redis.get(workflowKey);

  if (!workflowRaw) {
    await this.redisLoggerService.logResponse('router', workflowName, { error: `No workflow definition found for: ${workflowName}` });
    throw new Error(`No workflow definition found for: ${workflowName}`);
  }

  // 2. Parse the workflow definition
  const workflowDefinition = JSON.parse(workflowRaw);
  this.logger.log(`Found workflow definition for ${workflowName}: ${JSON.stringify(workflowDefinition)}`);
  
  // 3. Generate new workflow_instance_id and request_id
  const workflow_instance_id = `workflow_instance:${uuidv4()}`;
  const request_id = `req-${uuidv4()}`;

  // 4. Get available workers for this workflow
  let workerIds: string[] = [];
  
  // Try to get workers from the hash first
  const workflowWorkers = await this.redis.hgetall(`workflow:${workflowName}:workers`);
  if (workflowWorkers && Object.keys(workflowWorkers).length > 0) {
    workerIds = Object.keys(workflowWorkers);
    this.logger.log(`Found ${workerIds.length} workers from hash for workflow: ${workflowName}`);
  } else {
    // If not found in hash, try the set
    workerIds = await this.redis.smembers(`workflow:${workflowName}:worker_list`);
    if (workerIds && workerIds.length > 0) {
      this.logger.log(`Found ${workerIds.length} workers from set for workflow: ${workflowName}`);
    } else {
      await this.redisLoggerService.logResponse('router', workflowName, { error: `No workers found for workflow: ${workflowName}` });
      throw new Error(`No workers found for workflow: ${workflowName}`);
    }
  }

  this.logger.log(`Found ${workerIds.length} workers for workflow: ${workflowName}`);

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
          current_thread_count: parseInt(instanceDetails.current_thread_count || '0', 10),
          thread_capacity: parseInt(instanceDetails.thread_capacity || '1000', 10),
          utilization: (parseInt(instanceDetails.current_thread_count || '0', 10) / parseInt(instanceDetails.thread_capacity || '1000', 10)) * 100
        });
      }
    }
  }
  
  if (workerInstances.length === 0) {
    await this.redisLoggerService.logResponse('router', workflowName, { error: `No active worker instances found for workflow: ${workflowName}` });
    throw new Error(`No active worker instances found for workflow: ${workflowName}`);
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
          class: step.class
        },
        data: {
          workflow_instance_id,
          worker_id: chosenWorker.worker_id,
          worker_instance_id: chosenWorker.instance_id,
          config: metadata?.config || {},
          metadata: metadata || {}
        },
        metadata: {
          start_time: "",
          end_time: "",
          status: "pending"
        }
      };
      
      // Save step instance to Redis
      await this.redis.hset(
        step_instance_id,
        'definition', JSON.stringify(stepInstance.definition),
        'data', JSON.stringify(stepInstance.data),
        'metadata', JSON.stringify(stepInstance.metadata)
      );
      
      stepInstances.push(step_instance_id);
      
      // Add the step to the worker's queue
      const queueKey = `worker_instance:${chosenWorker.instance_id}:queue`;
      const queueItem = {
        workflow_instance_id,
        step_instance_id
      };
      await this.redis.lpush(queueKey, JSON.stringify(queueItem));
      
      const stepAddedMsg = `Added step ${step_instance_id} to queue ${queueKey}`;
      this.logger.log(stepAddedMsg);
      
      // Emit the step added event to connected clients
      this.workerLogEmitterService.emitWorkerLog(stepAddedMsg);
      
      // Increment the worker's thread count
      await this.redis.hincrby(chosenWorker.instance_id, 'current_thread_count', 1);
    }
  }
  
  // 8. Create the workflow instance with hooks
  const workflowInstance = {
    definition: {
      hooks: workflowDefinition.hooks || {
        on_start: {},
        on_complete: {},
        on_failure: {}
      },
      steps: stepInstances
    },
    data: {
      workflow: workflowName,
      payload: metadata || {},
      workflow_instance_id,
      request_id
    },
    metadata: {
      start_time: new Date().toISOString(),
      end_time: "",
      status: "pending",
      current_step: stepInstances[0] || ""
    }
  };
  
  // 9. Save the workflow instance
  await this.redis.hset(
    workflow_instance_id,
    'definition', JSON.stringify(workflowInstance.definition),
    'data', JSON.stringify(workflowInstance.data),
    'metadata', JSON.stringify(workflowInstance.metadata)
  );
  
  await this.redisLoggerService.logResponse('router', workflowName, {
    workflow_instance_id,
    request_id,
    steps: stepInstances,
    worker: {
      id: chosenWorker.worker_id,
      instance: chosenWorker.instance_id,
      utilization: chosenWorker.utilization
    }
  });
  
  return {
    status: 'workflow_started',
    workflow_instance_id,
    request_id,
    steps: stepInstances
  };
}
}
