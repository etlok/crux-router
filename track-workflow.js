/**
 * Redis Workflow Tracker
 * 
 * This script tracks a specific workflow instance and all its steps through the Redis database.
 * It provides a detailed view of the execution flow.
 */

const Redis = require('ioredis');
const redis = new Redis(); // Default connection to localhost:6379

async function trackWorkflowInstance(workflowInstanceId = null) {
  try {
    console.log('\n=== CRUX WORKFLOW TRACKER ===\n');
    
    // If no workflow ID is provided, find the most recent one
    if (!workflowInstanceId) {
      const workflowInstances = await redis.keys('workflow_instance:*');
      if (workflowInstances.length === 0) {
        console.log('No workflow instances found in Redis.');
        return;
      }
      
      // Sort by creation time if possible (we're using the most recent one as a fallback)
      workflowInstanceId = workflowInstances[workflowInstances.length - 1];
      console.log(`No workflow ID provided. Using most recent: ${workflowInstanceId}`);
    }
    
    // 1. Get workflow instance data
    const definition = await redis.hget(workflowInstanceId, 'definition');
    const data = await redis.hget(workflowInstanceId, 'data');
    const metadata = await redis.hget(workflowInstanceId, 'metadata');
    
    console.log(`\n=== WORKFLOW INSTANCE: ${workflowInstanceId} ===`);
    
    try {
      if (data) {
        const instanceData = JSON.parse(data);
        console.log(`Request ID: ${instanceData.request_id || 'N/A'}`);
        console.log(`Workflow Name: ${instanceData.workflow_name || 'N/A'}`);
      }
      
      if (metadata) {
        const meta = JSON.parse(metadata);
        console.log(`Status: ${meta.status || 'unknown'}`);
        console.log(`Start Time: ${meta.start_time || 'N/A'}`);
        console.log(`End Time: ${meta.end_time || 'N/A'}`);
        console.log(`Duration: ${meta.end_time && meta.start_time ? 
          new Date(meta.end_time) - new Date(meta.start_time) + 'ms' : 'N/A'}`);
      }
      
      if (definition) {
        const def = JSON.parse(definition);
        if (def.hooks) {
          console.log('\nHooks:');
          Object.entries(def.hooks).forEach(([hookName, hookConfig]) => {
            console.log(`  ${hookName}: ${JSON.stringify(hookConfig)}`);
          });
        }
      }
    } catch (err) {
      console.log(`Error parsing workflow instance data: ${err.message}`);
    }
    
    // 2. Find all step instances for this workflow
    console.log('\n=== STEP INSTANCES ===');
    const allStepInstances = await redis.keys('step_instance:*');
    const workflowSteps = [];
    
    // Collect all steps belonging to this workflow instance
    for (const stepKey of allStepInstances) {
      const stepData = await redis.hget(stepKey, 'data');
      if (stepData) {
        try {
          const parsedData = JSON.parse(stepData);
          if (parsedData.workflow_instance_id === workflowInstanceId) {
            const definition = await redis.hget(stepKey, 'definition');
            const metadata = await redis.hget(stepKey, 'metadata');
            
            workflowSteps.push({
              id: stepKey,
              definition: definition ? JSON.parse(definition) : null,
              data: parsedData,
              metadata: metadata ? JSON.parse(metadata) : null
            });
          }
        } catch (err) {
          console.log(`Error parsing step data for ${stepKey}: ${err.message}`);
        }
      }
    }
    
    // Sort steps by start time if available
    workflowSteps.sort((a, b) => {
      const aTime = a.metadata?.start_time ? new Date(a.metadata.start_time) : 0;
      const bTime = b.metadata?.start_time ? new Date(b.metadata.start_time) : 0;
      return aTime - bTime;
    });
    
    // Display step information
    if (workflowSteps.length === 0) {
      console.log('No step instances found for this workflow.');
    } else {
      console.log(`Found ${workflowSteps.length} steps for this workflow:\n`);
      
      workflowSteps.forEach((step, index) => {
        console.log(`Step ${index + 1}: ${step.id}`);
        console.log(`  Type: ${step.definition?.type || 'N/A'}`);
        console.log(`  Class: ${step.definition?.class || 'N/A'}`);
        console.log(`  Worker: ${step.data?.worker_id || 'N/A'}`);
        console.log(`  Worker Instance: ${step.data?.worker_instance_id || 'N/A'}`);
        console.log(`  Status: ${step.metadata?.status || 'unknown'}`);
        
        if (step.metadata?.start_time) {
          console.log(`  Started: ${step.metadata.start_time}`);
        }
        if (step.metadata?.end_time) {
          console.log(`  Completed: ${step.metadata.end_time}`);
          console.log(`  Duration: ${new Date(step.metadata.end_time) - new Date(step.metadata.start_time)}ms`);
        }
        
        if (step.metadata?.error) {
          console.log(`  Error: ${step.metadata.error}`);
        }
        
        console.log(''); // Empty line for readability
      });
    }
    
    // 3. Check worker queues for this workflow
    console.log('\n=== WORKER QUEUES ===');
    const workerQueues = await redis.keys('worker_instance:*:queue');
    let found = false;
    
    for (const queueKey of workerQueues) {
      const queueItems = await redis.lrange(queueKey, 0, -1);
      const relevantItems = [];
      
      for (const item of queueItems) {
        try {
          const parsed = JSON.parse(item);
          if (parsed.workflow_instance_id === workflowInstanceId) {
            relevantItems.push(parsed);
          }
        } catch (err) {
          // Skip items that can't be parsed
        }
      }
      
      if (relevantItems.length > 0) {
        found = true;
        console.log(`\nQueue: ${queueKey}`);
        console.log(`Items for this workflow: ${relevantItems.length}`);
        
        relevantItems.forEach((item, i) => {
          console.log(`  ${i+1}. Step instance: ${item.step_instance_id}`);
        });
      }
    }
    
    if (!found) {
      console.log('No items for this workflow found in any worker queue.');
    }
    
    // 4. Look for execution results/outputs if any
    console.log('\n=== EXECUTION RESULTS ===');
    const resultsKey = `${workflowInstanceId}:results`;
    const resultsExists = await redis.exists(resultsKey);
    
    if (resultsExists) {
      const results = await redis.get(resultsKey);
      try {
        console.log(JSON.parse(results));
      } catch (err) {
        console.log(results);
      }
    } else {
      console.log('No execution results found for this workflow.');
    }
    
  } catch (error) {
    console.error('Error tracking workflow:', error);
  } finally {
    redis.quit();
  }
}

// Check if a workflow instance ID was provided as an argument
const workflowId = process.argv[2];
trackWorkflowInstance(workflowId);
