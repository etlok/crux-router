import { Inject, Injectable, LoggerService } from '@nestjs/common';
import Redis from 'ioredis';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RedisLoggerService } from './redis-logger.service';
import { v4 as uuidv4 } from 'uuid'; 

@Injectable()
export class RouterService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly redisLoggerService: RedisLoggerService,
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




async routeEvent(eventName: string, metadata?: any) {
  await this.redisLoggerService.logRequest('router', eventName, { metadata });

  // 1. Fetch the predefined workflow instance template from Redis
  const workflowKey = `workflow:${eventName}`;
  const workflowRaw = await this.redis.get(workflowKey);

  if (!workflowRaw) {
    await this.redisLoggerService.logResponse('router', eventName, { error: `No workflow definition found for event: ${eventName}` });
    throw new Error(`No workflow definition found for event: ${eventName}`);
  }

  // 2. Parse and clone the workflow instance template
  const workflowTemplate = JSON.parse(workflowRaw);

  // 3. Generate new workflow_instance_id and request_id
  const workflow_instance_id = `workflow_instance:${uuidv4()}`;
  const request_id = `req-${uuidv4()}`;

  // 4. Update workflow instance data and metadata
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

  // 5. For each step, assign to a suitable worker and queue
  for (const step of workflowTemplate.definition.steps) {
    // Generate a new step_instance_id if needed
    const step_instance_id = step.step_instance_id || `step_instance:${uuidv4()}`;
    step.step_instance_id = step_instance_id;

    // --- Find suitable worker for this step ---
    // Use type/class/workflow_key to map to a workflow definition
    const stepWorkflowKey = step.definition.workflow_key || step.definition.type || step.definition.class;
    const workflowDefKey = `workflow:${stepWorkflowKey}`;
    const workflowDefRaw = await this.redis.get(workflowDefKey);

    if (!workflowDefRaw) {
      this.logger.warn(`No workflow definition found for step: ${step_instance_id} (key: ${workflowDefKey})`);
      continue;
    }
    const workflowDef = JSON.parse(workflowDefRaw);

    // Find eligible workers for this step
    const workers = workflowDef.workers;
    if (!workers || Object.keys(workers).length === 0) {
      this.logger.warn(`No workers defined for step: ${step_instance_id} (workflow: ${workflowDefKey})`);
      continue;
    }
    const eligibleWorkers = Object.entries(workers).map(([worker_id, details]: [string, any]) => ({
      worker_id,
      ...details
    }));

    // Select the worker with the lowest thread count
    const chosenWorker = eligibleWorkers.reduce((prev, curr) =>
      prev.threads <= curr.threads ? prev : curr
    );

    // Optionally increment the thread count in Redis (persist the change)
    // chosenWorker.threads += 1;
    // workflowDef.workers[chosenWorker.worker_id].threads = chosenWorker.threads;
    // await this.redis.set(workflowDefKey, JSON.stringify(workflowDef));

    // Save the chosen worker in the step data for traceability
    step.data = {
      ...step.data,
      worker_instance_id: chosenWorker.instance_id,
      worker_id: chosenWorker.worker_id
    };

    // Save the step instance as a hash (definition, data, metadata as JSON strings)
    await this.redis.hset(
      step_instance_id,
      'definition', JSON.stringify(step.definition),
      'data', JSON.stringify(step.data),
      'metadata', JSON.stringify(step.metadata)
    );

    // Push the step to the chosen worker's queue
    const queueKey = `worker_instance:${chosenWorker.instance_id}:queue`;
    const queueItem = {
      workflow_instance_id,
      step_instance_id
    };
    await this.redis.lpush(queueKey, JSON.stringify(queueItem));
  }

  // 6. Save the updated workflow instance (with all step_instance_ids)
  await this.redis.hset(
    workflow_instance_id,
    'definition', JSON.stringify(workflowTemplate.definition),
    'data', JSON.stringify(workflowTemplate.data),
    'metadata', JSON.stringify(workflowTemplate.metadata)
  );

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
}
