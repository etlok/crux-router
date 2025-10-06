#!/usr/bin/env node

/**
 * Redis Middleware Inspector
 * 
 * This script displays the exact middleware configuration data
 * stored in Redis, showing the raw values and structures.
 */

const { createClient } = require('redis');

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_MIDDLEWARE_KEYS = {
  CONFIG_LIST: 'middleware:config:list',
  CONFIG_ITEM_PREFIX: 'middleware:config:item:',
  ACTIVE_MIDDLEWARE: 'middleware:config:active',
};

// Create Redis client
async function createRedisClient() {
  const client = createClient({
    url: REDIS_URL
  });

  client.on('error', err => console.error('Redis Client Error:', err));
  await client.connect();
  
  return client;
}

// Inspect middleware configuration in Redis
async function inspectRedisMiddleware() {
  let client;
  
  try {
    console.log('=== Redis Middleware Configuration Inspector ===\n');
    
    client = await createRedisClient();
    console.log('Connected to Redis server');
    
    // 1. Get the list of middleware keys
    console.log('\n=== Middleware Keys List ===');
    const middlewareKeys = await client.sMembers(REDIS_MIDDLEWARE_KEYS.CONFIG_LIST);
    console.log(`Found ${middlewareKeys.length} middleware keys in Redis:`);
    console.log(middlewareKeys);
    
    // 2. Get all middleware configurations
    console.log('\n=== Individual Middleware Configurations ===');
    for (const key of middlewareKeys) {
      const configKey = `${REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX}${key}`;
      const configJson = await client.get(configKey);
      
      console.log(`\n--- ${key} ---`);
      console.log(`Redis Key: ${configKey}`);
      
      if (configJson) {
        const config = JSON.parse(configJson);
        console.log('Configuration Data:');
        console.log(JSON.stringify(config, null, 2));
        console.log(`Type: ${config.type}`);
        
        if (config.type === 'class') {
          console.log(`Path: ${config.path}`);
        } else if (config.type === 'group') {
          console.log(`Referenced Keys: ${config.keys.join(', ')}`);
        }
      } else {
        console.log('No configuration data found');
      }
    }
    
    // 3. Get active middleware
    console.log('\n=== Active Middleware ===');
    const activeMiddlewareJson = await client.get(REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE);
    
    if (activeMiddlewareJson) {
      const activeMiddleware = JSON.parse(activeMiddlewareJson);
      console.log('Active Middleware Keys:');
      console.log(activeMiddleware);
    } else {
      console.log('No active middleware configured');
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total middleware configurations: ${middlewareKeys.length}`);
    console.log(`Class-based middleware: ${middlewareKeys.filter(async key => {
      const config = JSON.parse(await client.get(`${REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX}${key}`));
      return config.type === 'class';
    }).length}`);
    
    console.log('\nNote: When a client sends an event with middleware configuration, these');
    console.log('keys are used to resolve the actual middleware implementation classes.');
    
  } catch (error) {
    console.error('Error inspecting Redis middleware:', error);
  } finally {
    if (client) {
      await client.quit();
      console.log('\nDisconnected from Redis');
    }
  }
}

// Run the script
inspectRedisMiddleware().catch(console.error);
