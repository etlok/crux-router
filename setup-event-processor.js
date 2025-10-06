#!/usr/bin/env node

/**
 * Setup script for Crux Web Socket middleware event processor testing
 * 
 * This script helps set up the middleware configurations in Redis and 
 * provides instructions for testing the event processor functionality.
 */

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Crux Web Socket Event Processor Setup ===\n');
console.log('This script will help you set up and test the middleware event processor.\n');

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit'
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function setupRedisMiddleware() {
  console.log('\n=== Setting up Redis Middleware Configurations ===');
  
  try {
    // Upload middleware configurations to Redis
    await runCommand('node', ['src/events/redis-middleware-cli.js', 'upload'], process.cwd());
    console.log('✅ Uploaded middleware configurations to Redis');
    
    // Set active middleware
    await runCommand('node', ['src/events/redis-middleware-cli.js', 'active', 'standard'], process.cwd());
    console.log('✅ Set active middleware to "standard"');
    
    // Show active middleware
    await runCommand('node', ['src/events/redis-middleware-cli.js', 'show-active'], process.cwd());
  } catch (error) {
    console.error('❌ Failed to set up Redis middleware:', error.message);
    return false;
  }
  
  return true;
}

async function startApplication() {
  console.log('\n=== Starting NestJS Application ===');
  console.log('Press Ctrl+C to stop the application when done testing.\n');
  
  try {
    await runCommand('npm', ['run', 'start:dev'], process.cwd());
  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    return false;
  }
  
  return true;
}

function showTestInstructions() {
  console.log('\n=== Testing Instructions ===');
  console.log('1. Open the event processor test page in your browser:');
  console.log('   file://' + path.resolve(process.cwd(), 'src/events/event-processor-test.html'));
  console.log('2. Click "Authenticate" with the provided test token');
  console.log('3. Send an event using the predefined JSON or modify it as needed');
  console.log('4. Check the application logs and the test page response');
  console.log('\nThe test page already contains a sample event configuration that uses:');
  console.log('- authentication, validation, and logging middleware');
  console.log('- a sample workflow action');
  console.log('\nYou can modify the middleware list and actions in the test page to experiment with different configurations.');
}

async function main() {
  try {
    // Setup Redis middleware
    const redisSetupSuccess = await setupRedisMiddleware();
    if (!redisSetupSuccess) {
      console.log('❌ Redis middleware setup failed. Please check Redis is running and try again.');
      process.exit(1);
    }
    
    // Show test instructions
    showTestInstructions();
    
    // Ask if user wants to start the application
    rl.question('\nDo you want to start the application now? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await startApplication();
      } else {
        console.log('\nSkipping application start.');
        console.log('You can start the application manually with "npm run start:dev" when ready.');
        rl.close();
      }
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
