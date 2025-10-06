// Script to set up workflow definitions and worker instances in Redis
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

// Configure Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});

async function setupWorkflowData() {
  console.log('Setting up workflow data in Redis...');
  
  try {
    // 1. Define workflow templates
    const workflows = {
      'create_entity': {
        hooks: {
          on_start: {
            type: 'standard',
            class: 'CreateEntityOnStart'
          },
          on_complete: {
            type: 'standard',
            class: 'CreateEntityOnComplete'
          },
          on_failure: {
            type: 'standard',
            class: 'CreateEntityOnFailure'
          }
        },
        steps: [
          {
            type: 'standard',
            class: 'CreateEntity'
          }
        ]
      },
      'update_entity': {
        hooks: {
          on_start: {
            type: 'standard',
            class: 'UpdateEntityOnStart'
          },
          on_complete: {
            type: 'standard',
            class: 'UpdateEntityOnComplete'
          }
        },
        steps: [
          {
            type: 'standard',
            class: 'ValidateEntityFields'
          },
          {
            type: 'standard',
            class: 'UpdateEntity'
          }
        ]
      },
      'delete_entity': {
        hooks: {
          on_start: {
            type: 'standard',
            class: 'DeleteEntityOnStart'
          },
          on_failure: {
            type: 'standard',
            class: 'DeleteEntityOnFailure'
          }
        },
        steps: [
          {
            type: 'standard',
            class: 'DeleteEntity'
          },
          {
            type: 'standard',
            class: 'CleanupEntityRelations'
          }
        ]
      }
    };
    
    // 2. Store workflow definitions in Redis
    for (const [workflowName, definition] of Object.entries(workflows)) {
      await redis.set(`workflow:${workflowName}`, JSON.stringify(definition));
      console.log(`Stored workflow definition: ${workflowName}`);
    }
    
    // 3. Define and register workers
    const workers = [
      '01-crux-generic-worker',
      '02-crux-generic-worker',
      '03-crux-specialized-worker'
    ];
    
    // 4. Map workers to workflows
    const workflowWorkerMapping = {
      'create_entity': ['01-crux-generic-worker', '02-crux-generic-worker'],
      'update_entity': ['01-crux-generic-worker', '02-crux-generic-worker', '03-crux-specialized-worker'],
      'delete_entity': ['02-crux-generic-worker', '03-crux-specialized-worker']
    };
    
    // 5. Store worker-workflow mappings
    for (const [workflowName, workerList] of Object.entries(workflowWorkerMapping)) {
      for (const workerId of workerList) {
        try {
          // Store as hash field in a separate hash
          await redis.hset(`workflow:${workflowName}:workers`, workerId, workerId);
          console.log(`Mapped worker ${workerId} to workflow ${workflowName} (in workers hash)`);
        } catch (error) {
          console.error(`Error mapping worker to workflow:${workflowName}:workers: ${error.message}`);
        }
        
        try {
          // Create a separate key for worker mappings instead of modifying the workflow key
          await redis.sadd(`workflow:${workflowName}:worker_list`, workerId);
          console.log(`Mapped worker ${workerId} to workflow ${workflowName} (in worker_list set)`);
        } catch (error) {
          console.error(`Error mapping worker to workflow:${workflowName}:worker_list: ${error.message}`);
        }
      }
    }
    
    // 6. Create worker instances
    const workerInstances = {};
    for (const workerId of workers) {
      // Create 2 instances per worker
      for (let i = 1; i <= 2; i++) {
        const instanceId = `crux:instance:${workerId}-${uuidv4().substring(0, 8)}`;
        workerInstances[instanceId] = {
          workerId,
          status: 'online',
          current_thread_count: Math.floor(Math.random() * 50), // Random thread count between 0-49
          thread_capacity: 1000
        };
        
        // Add instance to worker's instance set
        await redis.sadd(`crux:component:${workerId}:instances`, instanceId);
        
        // Store instance details
        await redis.hset(instanceId,
          'status', workerInstances[instanceId].status,
          'current_thread_count', workerInstances[instanceId].current_thread_count.toString(),
          'thread_capacity', workerInstances[instanceId].thread_capacity.toString()
        );
        
        console.log(`Created worker instance ${instanceId} for worker ${workerId}`);
      }
    }
    
    console.log('Workflow data setup complete!');
    
  } catch (error) {
    console.error('Error setting up workflow data:', error);
  } finally {
    // Close Redis connection
    redis.quit();
  }
}

// Run the setup
setupWorkflowData();
