// Script to inspect workflow data in Redis
const Redis = require('ioredis');

// Configure Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});

async function inspectWorkflowData() {
  console.log('Inspecting workflow data in Redis...');
  
  try {
    // 1. List all workflow keys
    const workflowKeys = await redis.keys('workflow:*');
    console.log(`Found ${workflowKeys.length} workflow-related keys`);
    
    // 2. Check each workflow definition
    for (const key of workflowKeys) {
      if (!key.includes(':workers') && !key.includes(':worker_list')) {
        // This is a workflow definition key
        console.log(`\n=== Inspecting workflow: ${key} ===`);
        
        // Check key type
        const keyType = await redis.type(key);
        console.log(`Key type: ${keyType}`);
        
        if (keyType === 'string') {
          const value = await redis.get(key);
          const workflowDef = JSON.parse(value);
          console.log('Workflow definition:');
          console.log(JSON.stringify(workflowDef, null, 2));
          
          // Check for workers
          const workersHashKey = `${key}:workers`;
          const workersSetKey = `${key}:worker_list`;
          
          console.log('\nWorker mappings:');
          try {
            // Check the key type first
            const hashKeyType = await redis.type(workersHashKey);
            if (hashKeyType === 'hash') {
              const workersHash = await redis.hgetall(workersHashKey);
              if (workersHash && Object.keys(workersHash).length > 0) {
                console.log(`Workers from hash (${workersHashKey}):`, Object.keys(workersHash));
              } else {
                console.log(`No workers found in hash (${workersHashKey})`);
              }
            } else if (hashKeyType !== 'none') {
              console.log(`Key ${workersHashKey} exists but is type ${hashKeyType}, not hash`);
            } else {
              console.log(`No workers hash found (${workersHashKey})`);
            }
          } catch (error) {
            console.log(`Error checking workers hash: ${error.message}`);
          }
          
          try {
            // Check the key type first
            const setKeyType = await redis.type(workersSetKey);
            if (setKeyType === 'set') {
              const workersSet = await redis.smembers(workersSetKey);
              if (workersSet && workersSet.length > 0) {
                console.log(`Workers from set (${workersSetKey}):`, workersSet);
              } else {
                console.log(`No workers found in set (${workersSetKey})`);
              }
            } else if (setKeyType !== 'none') {
              console.log(`Key ${workersSetKey} exists but is type ${setKeyType}, not set`);
            } else {
              console.log(`No workers set found (${workersSetKey})`);
            }
          } catch (error) {
            console.log(`Error checking workers set: ${error.message}`);
          }
          
          // Also check if there are worker fields in the workflow hash itself
          if (workflowDef.workers) {
            console.log('Workers defined directly in workflow definition:');
            console.log(Object.keys(workflowDef.workers));
          }
        }
      }
    }
    
    // 3. Check worker instances
    const workerComponentKeys = await redis.keys('crux:component:*:instances');
    console.log('\n=== Worker Components ===');
    
    for (const key of workerComponentKeys) {
      const workerId = key.split(':')[2];
      console.log(`\nWorker: ${workerId}`);
      
      const instanceIds = await redis.smembers(key);
      console.log(`Found ${instanceIds.length} instances`);
      
      for (const instanceId of instanceIds) {
        const instanceDetails = await redis.hgetall(instanceId);
        console.log(`  Instance ${instanceId}:`);
        console.log(`    Status: ${instanceDetails.status}`);
        console.log(`    Thread count: ${instanceDetails.current_thread_count}`);
        console.log(`    Thread capacity: ${instanceDetails.thread_capacity}`);
        console.log(`    Utilization: ${(parseInt(instanceDetails.current_thread_count) / parseInt(instanceDetails.thread_capacity) * 100).toFixed(2)}%`);
        
        // Check if there are any tasks in the queue for this instance
        const queueKey = `worker_instance:${instanceId}:queue`;
        const queueLength = await redis.llen(queueKey);
        console.log(`    Queue length: ${queueLength}`);
        
        if (queueLength > 0) {
          const queueItems = await redis.lrange(queueKey, 0, 5); // Get first 5 items
          console.log(`    Queue items (first ${Math.min(5, queueLength)}):`);
          queueItems.forEach((item, index) => {
            console.log(`      ${index}: ${item}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Error inspecting workflow data:', error);
  } finally {
    // Close Redis connection
    redis.quit();
  }
}

// Run the inspection
inspectWorkflowData();
