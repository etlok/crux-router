/**
 * Redis Data Explorer - Visualize Crux Workflow Data
 * 
 * This script connects to Redis and displays all data related to workflows,
 * workers, steps, and instances in a structured format.
 */

const Redis = require('ioredis');
const redis = new Redis(); // Default connection to localhost:6379
const util = require('util');

// Helper function to determine Redis key type and get appropriate data
async function getRedisData(key) {
  try {
    const type = await redis.type(key);
    
    switch(type) {
      case 'string':
        return { type, value: await redis.get(key) };
      case 'hash':
        return { type, value: await redis.hgetall(key) };
      case 'list':
        const listLength = await redis.llen(key);
        return { 
          type, 
          length: listLength,
          value: await redis.lrange(key, 0, Math.min(listLength, 10) - 1) 
        };
      case 'set':
        const members = await redis.smembers(key);
        return { type, length: members.length, value: members };
      case 'zset':
        const zsetMembers = await redis.zrange(key, 0, -1, 'WITHSCORES');
        return { type, length: zsetMembers.length / 2, value: zsetMembers };
      default:
        return { type, value: `Unsupported Redis type: ${type}` };
    }
  } catch (err) {
    return { type: 'unknown', error: err.message };
  }
}

async function exploreRedisData() {
  try {
    console.log('\n=== CRUX WORKFLOW SYSTEM - REDIS DATA EXPLORER ===\n');
    
    // 1. Get all keys to understand what's in the database
    const allKeys = await redis.keys('*');
    console.log(`Total Redis keys found: ${allKeys.length}\n`);
    
    // Group keys by prefix for better organization
    const keyGroups = {
      workflow: allKeys.filter(k => k.startsWith('workflow:')),
      workflowInstance: allKeys.filter(k => k.startsWith('workflow_instance:')),
      step: allKeys.filter(k => k.startsWith('step:')),
      stepInstance: allKeys.filter(k => k.startsWith('step_instance:')),
      worker: allKeys.filter(k => k.startsWith('crux:component:')),
      workerInstance: allKeys.filter(k => k.includes('instance:')),
      workerQueue: allKeys.filter(k => k.includes(':queue')),
      event: allKeys.filter(k => k.startsWith('event:')),
      other: allKeys.filter(k => !k.match(/workflow|step|worker|event|crux|queue/))
    };
    
    console.log('=== KEY DISTRIBUTION ===');
    Object.entries(keyGroups).forEach(([group, keys]) => {
      console.log(`${group}: ${keys.length} keys`);
    });
    console.log('\n');

    // 2. Workflow Definitions
    console.log('=== WORKFLOW DEFINITIONS ===');
    for (const workflowKey of keyGroups.workflow.filter(k => !k.includes(':workers') && !k.includes(':worker_list'))) {
      const { type, value, error } = await getRedisData(workflowKey);
      
      console.log(`\nWorkflow: ${workflowKey} (${type})`);
      
      if (error) {
        console.log(`Error: ${error}`);
        continue;
      }
      
      if (type === 'string') {
        try {
          const workflow = JSON.parse(value);
          console.log(`Name: ${workflow.name || 'N/A'}`);
          console.log(`Steps: ${workflow.steps ? workflow.steps.length : 0}`);
          console.log(`Hooks: ${Object.keys(workflow.hooks || {}).join(', ') || 'none'}`);
          
          if (workflow.steps && workflow.steps.length > 0) {
            console.log('\nStep definitions:');
            workflow.steps.forEach((step, i) => {
              console.log(`  ${i+1}. ${step.name || 'Unnamed'} (${step.type}, ${step.class})`);
            });
          }
        } catch (err) {
          console.log(`Raw value: ${value}`);
        }
      } else if (type === 'hash') {
        console.log(`Hash fields: ${Object.keys(value).join(', ')}`);
        console.log(value);
      } else {
        console.log(`Value type: ${type}`);
        console.log(value);
      }
    }
    
    // 3. Worker Instances
    console.log('\n=== WORKER INSTANCES ===');
    const workerInstanceKeys = keyGroups.workerInstance;
    for (const instanceKey of workerInstanceKeys) {
      const instanceData = await redis.hgetall(instanceKey);
      if (Object.keys(instanceData).length > 0) {
        console.log(`\nInstance: ${instanceKey}`);
        console.log(`Status: ${instanceData.status || 'unknown'}`);
        console.log(`Threads: ${instanceData.current_thread_count || '0'}/${instanceData.thread_capacity || '0'}`);
        console.log(`Utilization: ${((parseInt(instanceData.current_thread_count || '0') / parseInt(instanceData.thread_capacity || '100')) * 100).toFixed(2)}%`);
      }
    }
    
    // 4. Worker Queues
    console.log('\n=== WORKER QUEUES ===');
    for (const queueKey of keyGroups.workerQueue) {
      const queueLength = await redis.llen(queueKey);
      console.log(`\nQueue: ${queueKey}`);
      console.log(`Length: ${queueLength} items`);
      
      if (queueLength > 0) {
        console.log('Queue items (up to 5):');
        // Get up to 5 items from the queue to avoid overwhelming output
        const queueItems = await redis.lrange(queueKey, 0, 4);
        for (let i = 0; i < queueItems.length; i++) {
          try {
            const item = JSON.parse(queueItems[i]);
            console.log(`  ${i+1}. Workflow instance: ${item.workflow_instance_id}`);
            console.log(`     Step instance: ${item.step_instance_id}`);
          } catch (err) {
            console.log(`  ${i+1}. ${queueItems[i]}`);
          }
        }
      }
    }
    
    // 5. Step Instances
    console.log('\n=== STEP INSTANCES ===');
    // Get a sample of step instances (up to 5)
    const sampleStepInstances = keyGroups.stepInstance.slice(0, 5);
    for (const stepKey of sampleStepInstances) {
      console.log(`\nStep Instance: ${stepKey}`);
      
      const definition = await redis.hget(stepKey, 'definition');
      const data = await redis.hget(stepKey, 'data');
      const metadata = await redis.hget(stepKey, 'metadata');
      
      try {
        if (definition) {
          const def = JSON.parse(definition);
          console.log(`Type: ${def.type}`);
          console.log(`Class: ${def.class}`);
        }
        
        if (data) {
          const stepData = JSON.parse(data);
          console.log(`Worker: ${stepData.worker_id}`);
          console.log(`Worker Instance: ${stepData.worker_instance_id}`);
          console.log(`Associated Workflow: ${stepData.workflow_instance_id}`);
        }
        
        if (metadata) {
          const meta = JSON.parse(metadata);
          console.log(`Status: ${meta.status}`);
          if (meta.start_time) console.log(`Started: ${meta.start_time}`);
          if (meta.end_time) console.log(`Completed: ${meta.end_time}`);
        }
      } catch (err) {
        console.log(`Error parsing step instance data: ${err.message}`);
      }
    }
    
    // 6. Workflow Instances
    console.log('\n=== WORKFLOW INSTANCES ===');
    // Get a sample of workflow instances (up to 5)
    const sampleWorkflowInstances = keyGroups.workflowInstance.slice(0, 5);
    for (const instanceKey of sampleWorkflowInstances) {
      console.log(`\nWorkflow Instance: ${instanceKey}`);
      
      const definition = await redis.hget(instanceKey, 'definition');
      const data = await redis.hget(instanceKey, 'data');
      const metadata = await redis.hget(instanceKey, 'metadata');
      
      try {
        if (definition) {
          const def = JSON.parse(definition);
          console.log(`Hooks: ${Object.keys(def.hooks || {}).join(', ') || 'none'}`);
        }
        
        if (data) {
          const instanceData = JSON.parse(data);
          console.log(`Request ID: ${instanceData.request_id || 'N/A'}`);
        }
        
        if (metadata) {
          const meta = JSON.parse(metadata);
          console.log(`Status: ${meta.status}`);
          if (meta.start_time) console.log(`Started: ${meta.start_time}`);
          if (meta.end_time) console.log(`Completed: ${meta.end_time}`);
        }
      } catch (err) {
        console.log(`Error parsing workflow instance data: ${err.message}`);
      }
    }
    
    console.log('\n=== EVENT DEFINITIONS ===');
    for (const eventKey of keyGroups.event.slice(0, 5)) {
      const eventData = await redis.get(eventKey);
      if (eventData) {
        try {
          const event = JSON.parse(eventData);
          console.log(`\nEvent: ${eventKey}`);
          console.log(`Outcomes: ${event.outcome ? event.outcome.length : 0}`);
          
          if (event.outcome && event.outcome.length > 0) {
            event.outcome.forEach((outcome, i) => {
              console.log(`  Outcome ${i+1}: ${outcome.type} -> ${outcome.workflow || 'N/A'}`);
            });
          }
        } catch (err) {
          console.log(`Error parsing event data for ${eventKey}: ${err.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error exploring Redis data:', error);
  } finally {
    redis.quit();
  }
}

exploreRedisData();
