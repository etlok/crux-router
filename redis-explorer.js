/**
 * Redis Interactive CLI for Crux System
 * 
 * This script provides an interactive CLI to explore Redis data for the Crux workflow system.
 */

const Redis = require('ioredis');
const readline = require('readline');

const redis = new Redis(); // Default connection to localhost:6379

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to format and display Redis data
function formatOutput(data) {
  if (typeof data === 'string') {
    // Try to parse as JSON for better formatting
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return data;
    }
  } else if (Array.isArray(data)) {
    return data.map((item, i) => `${i+1}. ${item}`).join('\n');
  } else if (typeof data === 'object' && data !== null) {
    return JSON.stringify(data, null, 2);
  }
  return data;
}

// Display main menu
function displayMenu() {
  console.log('\n=== CRUX REDIS EXPLORER ===');
  console.log('1. List all keys by pattern');
  console.log('2. Examine key details');
  console.log('3. View workflow definitions');
  console.log('4. View worker instances');
  console.log('5. Monitor worker queues');
  console.log('6. Track workflow instance');
  console.log('7. Execute Redis command');
  console.log('8. Exit');
  
  rl.question('\nEnter your choice (1-8): ', handleMenuChoice);
}

// Handle menu choice
async function handleMenuChoice(choice) {
  try {
    switch (choice) {
      case '1': // List all keys by pattern
        rl.question('Enter key pattern (default: *): ', async (pattern) => {
          pattern = pattern || '*';
          const keys = await redis.keys(pattern);
          console.log(`\nFound ${keys.length} keys matching "${pattern}":`);
          if (keys.length > 0) {
            keys.sort().forEach((key, i) => console.log(`${i+1}. ${key}`));
          }
          displayMenu();
        });
        break;
        
      case '2': // Examine key details
        rl.question('Enter key name: ', async (key) => {
          if (!key) {
            console.log('No key specified.');
            displayMenu();
            return;
          }
          
          const exists = await redis.exists(key);
          if (!exists) {
            console.log(`Key "${key}" does not exist.`);
            displayMenu();
            return;
          }
          
          const type = await redis.type(key);
          console.log(`\nKey: ${key} (Type: ${type})`);
          
          let data;
          switch(type) {
            case 'string':
              data = await redis.get(key);
              console.log(`Value: ${formatOutput(data)}`);
              break;
            case 'hash':
              data = await redis.hgetall(key);
              console.log('Hash fields:');
              for (const [field, value] of Object.entries(data)) {
                console.log(`  ${field}: ${formatOutput(value)}`);
              }
              break;
            case 'list':
              const listLength = await redis.llen(key);
              console.log(`List length: ${listLength}`);
              rl.question('How many items to show (default: 10): ', async (limit) => {
                limit = parseInt(limit) || 10;
                data = await redis.lrange(key, 0, limit - 1);
                console.log(`Items (1-${Math.min(limit, data.length)}):`);
                data.forEach((item, i) => console.log(`  ${i+1}. ${formatOutput(item)}`));
                displayMenu();
              });
              return; // Don't call displayMenu() yet
            case 'set':
              data = await redis.smembers(key);
              console.log(`Set members (${data.length}):`);
              data.forEach((item, i) => console.log(`  ${i+1}. ${item}`));
              break;
            case 'zset':
              data = await redis.zrange(key, 0, -1, 'WITHSCORES');
              console.log(`Sorted set members (${data.length / 2}):`);
              for (let i = 0; i < data.length; i += 2) {
                console.log(`  ${i/2+1}. ${data[i]} (score: ${data[i+1]})`);
              }
              break;
            default:
              console.log(`Unsupported Redis type: ${type}`);
          }
          displayMenu();
        });
        break;
        
      case '3': // View workflow definitions
        const workflowKeys = await redis.keys('workflow:*');
        console.log(`\nFound ${workflowKeys.length} workflow definitions:`);
        
        workflowKeys.sort().forEach((key, i) => console.log(`${i+1}. ${key}`));
        
        rl.question('\nEnter workflow number to examine (or 0 to return): ', async (num) => {
          const index = parseInt(num) - 1;
          if (isNaN(index) || index < 0 || index >= workflowKeys.length) {
            displayMenu();
            return;
          }
          
          const key = workflowKeys[index];
          const type = await redis.type(key);
          
          console.log(`\nWorkflow: ${key} (Type: ${type})`);
          
          if (type === 'string') {
            const data = await redis.get(key);
            try {
              const workflow = JSON.parse(data);
              console.log(`Name: ${workflow.name || 'N/A'}`);
              console.log(`Steps: ${workflow.steps ? workflow.steps.length : 0}`);
              
              if (workflow.hooks) {
                console.log(`\nHooks:`);
                Object.entries(workflow.hooks).forEach(([hookName, config]) => {
                  console.log(`  ${hookName}: ${JSON.stringify(config)}`);
                });
              }
              
              if (workflow.steps && workflow.steps.length > 0) {
                console.log('\nStep definitions:');
                workflow.steps.forEach((step, i) => {
                  console.log(`  ${i+1}. ${step.name || 'Unnamed'} (${step.type || 'unknown'}, ${step.class || 'unknown'})`);
                });
              }
            } catch (e) {
              console.log(`Raw data: ${data}`);
            }
          } else {
            console.log('Cannot display non-string workflow data. Use "Examine key details" option instead.');
          }
          
          displayMenu();
        });
        break;
        
      case '4': // View worker instances
        const workerKeys = await redis.keys('crux:instance:*');
        console.log(`\nFound ${workerKeys.length} worker instances:`);
        
        for (let i = 0; i < workerKeys.length; i++) {
          const key = workerKeys[i];
          const data = await redis.hgetall(key);
          console.log(`\n${i+1}. ${key}`);
          console.log(`   Status: ${data.status || 'unknown'}`);
          console.log(`   Threads: ${data.current_thread_count || '0'}/${data.thread_capacity || '0'}`);
          
          const utilization = ((parseInt(data.current_thread_count || '0') / parseInt(data.thread_capacity || '100')) * 100).toFixed(2);
          console.log(`   Utilization: ${utilization}%`);
        }
        
        displayMenu();
        break;
        
      case '5': // Monitor worker queues
        const queueKeys = await redis.keys('*:queue');
        console.log(`\nFound ${queueKeys.length} queues:`);
        
        for (let i = 0; i < queueKeys.length; i++) {
          const key = queueKeys[i];
          const length = await redis.llen(key);
          console.log(`\n${i+1}. ${key} (${length} items)`);
          
          if (length > 0) {
            const items = await redis.lrange(key, 0, Math.min(length, 5) - 1);
            console.log('   Recent items:');
            items.forEach((item, j) => {
              try {
                const parsed = JSON.parse(item);
                console.log(`   ${j+1}. ${JSON.stringify(parsed)}`);
              } catch (e) {
                console.log(`   ${j+1}. ${item}`);
              }
            });
          }
        }
        
        displayMenu();
        break;
        
      case '6': // Track workflow instance
        const instanceKeys = await redis.keys('workflow_instance:*');
        console.log(`\nFound ${instanceKeys.length} workflow instances:`);
        instanceKeys.sort().forEach((key, i) => console.log(`${i+1}. ${key}`));
        
        rl.question('\nEnter workflow instance number to track (or 0 to return): ', async (num) => {
          const index = parseInt(num) - 1;
          if (isNaN(index) || index < 0 || index >= instanceKeys.length) {
            displayMenu();
            return;
          }
          
          const key = instanceKeys[index];
          console.log(`\nTracking workflow: ${key}`);
          
          // Get workflow instance data
          const definition = await redis.hget(key, 'definition');
          const data = await redis.hget(key, 'data');
          const metadata = await redis.hget(key, 'metadata');
          
          if (data) {
            try {
              const parsedData = JSON.parse(data);
              console.log(`\nRequest ID: ${parsedData.request_id || 'N/A'}`);
              console.log(`Workflow: ${parsedData.workflow_name || 'N/A'}`);
            } catch (e) {
              console.log(`Data: ${data}`);
            }
          }
          
          if (metadata) {
            try {
              const parsedMeta = JSON.parse(metadata);
              console.log(`Status: ${parsedMeta.status || 'unknown'}`);
              if (parsedMeta.start_time) console.log(`Started: ${parsedMeta.start_time}`);
              if (parsedMeta.end_time) console.log(`Ended: ${parsedMeta.end_time}`);
            } catch (e) {
              console.log(`Metadata: ${metadata}`);
            }
          }
          
          // Find step instances for this workflow
          console.log('\nLooking for step instances...');
          const stepInstances = [];
          const allStepKeys = await redis.keys('step_instance:*');
          
          for (const stepKey of allStepKeys) {
            const stepData = await redis.hget(stepKey, 'data');
            if (stepData) {
              try {
                const parsedStepData = JSON.parse(stepData);
                if (parsedStepData.workflow_instance_id === key) {
                  stepInstances.push(stepKey);
                }
              } catch (e) {
                // Skip unparseable data
              }
            }
          }
          
          console.log(`Found ${stepInstances.length} step instances for this workflow:`);
          for (const stepKey of stepInstances) {
            console.log(`\nStep: ${stepKey}`);
            
            const stepDef = await redis.hget(stepKey, 'definition');
            const stepData = await redis.hget(stepKey, 'data');
            const stepMeta = await redis.hget(stepKey, 'metadata');
            
            if (stepDef) {
              try {
                const parsed = JSON.parse(stepDef);
                console.log(`  Type: ${parsed.type || 'N/A'}`);
                console.log(`  Class: ${parsed.class || 'N/A'}`);
              } catch (e) {}
            }
            
            if (stepMeta) {
              try {
                const parsed = JSON.parse(stepMeta);
                console.log(`  Status: ${parsed.status || 'unknown'}`);
                if (parsed.start_time) console.log(`  Started: ${parsed.start_time}`);
                if (parsed.end_time) console.log(`  Ended: ${parsed.end_time}`);
              } catch (e) {}
            }
          }
          
          displayMenu();
        });
        break;
        
      case '7': // Execute Redis command
        rl.question('Enter Redis command: ', async (cmd) => {
          if (!cmd) {
            displayMenu();
            return;
          }
          
          const args = cmd.split(' ');
          const command = args.shift().toUpperCase();
          
          try {
            const result = await redis[command.toLowerCase()](...args);
            console.log('\nCommand Result:');
            console.log(formatOutput(result));
          } catch (err) {
            console.error(`Error executing command: ${err.message}`);
          }
          
          displayMenu();
        });
        break;
        
      case '8': // Exit
        console.log('Goodbye!');
        redis.quit();
        rl.close();
        break;
        
      default:
        console.log('Invalid choice. Please try again.');
        displayMenu();
    }
  } catch (error) {
    console.error('Error:', error);
    displayMenu();
  }
}

console.log('Connecting to Redis...');

// Start the application
redis.ping().then(() => {
  console.log('Connected to Redis server successfully!');
  displayMenu();
}).catch((err) => {
  console.error(`Failed to connect to Redis: ${err.message}`);
  rl.close();
});

// Handle exit
rl.on('close', () => {
  console.log('Redis explorer closed.');
  process.exit(0);
});
