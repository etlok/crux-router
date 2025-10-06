/**
 * Redis Worker Monitor
 * 
 * This script monitors worker instances and their queues in Redis.
 */

const Redis = require('ioredis');
const redis = new Redis(); // Default connection to localhost:6379

async function monitorWorkers() {
  try {
    console.log('\n=== CRUX WORKER MONITOR ===\n');
    
    // 1. Find all worker instances
    const instanceKeys = await redis.keys('crux:instance:*');
    console.log(`Found ${instanceKeys.length} worker instances\n`);
    
    if (instanceKeys.length === 0) {
      console.log('No worker instances found in Redis.');
      return;
    }
    
    // 2. Get worker details and sort by utilization
    const workers = [];
    for (const instanceKey of instanceKeys) {
      const instanceData = await redis.hgetall(instanceKey);
      if (Object.keys(instanceData).length > 0) {
        const workerId = instanceKey.split(':').slice(0, 3).join(':');
        const queueKey = `worker_instance:${instanceKey}:queue`;
        const queueLength = await redis.llen(queueKey);
        
        workers.push({
          id: instanceKey,
          workerId: workerId,
          status: instanceData.status || 'unknown',
          currentThreads: parseInt(instanceData.current_thread_count || '0', 10),
          threadCapacity: parseInt(instanceData.thread_capacity || '1000', 10),
          utilization: ((parseInt(instanceData.current_thread_count || '0', 10) / parseInt(instanceData.thread_capacity || '1000', 10)) * 100).toFixed(2),
          queueLength,
          queueKey
        });
      }
    }
    
    // Sort by utilization (highest first)
    workers.sort((a, b) => parseFloat(b.utilization) - parseFloat(a.utilization));
    
    // 3. Display worker information
    for (const worker of workers) {
      console.log(`=== WORKER: ${worker.id} ===`);
      console.log(`Status: ${worker.status}`);
      console.log(`Threads: ${worker.currentThreads}/${worker.threadCapacity}`);
      console.log(`Utilization: ${worker.utilization}%`);
      console.log(`Queue length: ${worker.queueLength} items`);
      
      // Get workflow mappings for this worker
      const workflowMappings = await redis.keys(`workflow:*:workers:${worker.workerId}`);
      if (workflowMappings.length > 0) {
        console.log('\nWorkflows mapped to this worker:');
        for (const mapping of workflowMappings) {
          const workflow = mapping.split(':')[1];
          console.log(`- ${workflow}`);
        }
      }
      
      // Display queue contents
      if (worker.queueLength > 0) {
        console.log('\nQueue contents (up to 10 items):');
        const queueItems = await redis.lrange(worker.queueKey, 0, 9);
        
        for (let i = 0; i < queueItems.length; i++) {
          try {
            const item = JSON.parse(queueItems[i]);
            console.log(`  ${i+1}. Workflow: ${item.workflow_instance_id.split(':').pop()}`);
            console.log(`     Step: ${item.step_instance_id.split(':').pop()}`);
          } catch (err) {
            console.log(`  ${i+1}. ${queueItems[i]}`);
          }
        }
      }
      
      console.log('\n');
    }
    
    // 4. Show completed tasks (if any)
    console.log('=== COMPLETED TASKS ===');
    const completedTasksKeys = await redis.keys('*:completed_tasks');
    
    if (completedTasksKeys.length > 0) {
      for (const completedKey of completedTasksKeys) {
        const completedCount = await redis.scard(completedKey);
        console.log(`${completedKey}: ${completedCount} completed tasks`);
        
        if (completedCount > 0) {
          console.log('Recent completed tasks (up to 5):');
          const tasks = await redis.smembers(completedKey);
          for (let i = 0; i < Math.min(5, tasks.length); i++) {
            console.log(`- ${tasks[i]}`);
          }
        }
      }
    } else {
      console.log('No completed tasks found.');
    }
    
  } catch (error) {
    console.error('Error monitoring workers:', error);
  } finally {
    redis.quit();
  }
}

monitorWorkers();
