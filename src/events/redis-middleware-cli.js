#!/usr/bin/env node

const { createClient } = require('redis');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MIDDLEWARE_CONFIG_FILE = path.join(process.cwd(), 'middleware.json');
const REDIS_MIDDLEWARE_KEYS = {
  CONFIG_LIST: 'middleware:config:list',
  CONFIG_ITEM_PREFIX: 'middleware:config:item:',
  ACTIVE_MIDDLEWARE: 'middleware:config:active',
};

// Sample active middleware configurations
const SAMPLE_ACTIVE_MIDDLEWARE = {
  standard: ['authentication', 'logging', 'validation'],
  minimal: ['logging'],
  secure: ['authentication', 'validation', 'rate-limiting'],
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

// Load middleware configurations from file
async function loadConfigFromFile(filePath = MIDDLEWARE_CONFIG_FILE) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Failed to load middleware config from ${filePath}:`, error);
    return [];
  }
}

// Upload middleware configurations to Redis
async function uploadConfigToRedis(client, configs) {
  try {
    // Clear existing configurations
    await client.del(REDIS_MIDDLEWARE_KEYS.CONFIG_LIST);
    
    // Delete all existing config items
    const existingKeys = await client.keys(`${REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX}*`);
    if (existingKeys.length > 0) {
      await client.del(existingKeys);
    }
    
    // Store each configuration in Redis
    for (const config of configs) {
      // Add to the list of keys
      await client.sAdd(REDIS_MIDDLEWARE_KEYS.CONFIG_LIST, config.key);
      
      // Store the configuration
      await client.set(
        `${REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX}${config.key}`,
        JSON.stringify(config)
      );
      
      console.log(`Stored middleware config: ${config.key}`);
    }
    
    console.log(`Uploaded ${configs.length} middleware configurations to Redis`);
  } catch (error) {
    console.error('Error uploading configurations:', error);
  }
}

// Get all middleware configurations from Redis
async function getAllConfigs(client) {
  try {
    // Get all keys
    const keys = await client.sMembers(REDIS_MIDDLEWARE_KEYS.CONFIG_LIST);
    
    if (!keys || keys.length === 0) {
      return [];
    }
    
    // Get all configurations
    const configs = [];
    for (const key of keys) {
      const configJson = await client.get(`${REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX}${key}`);
      if (configJson) {
        configs.push(JSON.parse(configJson));
      }
    }
    
    return configs;
  } catch (error) {
    console.error('Error getting configurations:', error);
    return [];
  }
}

// Set active middleware
async function setActiveMiddleware(client, keys) {
  try {
    await client.set(REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE, JSON.stringify(keys));
    console.log(`Set active middleware: ${keys.join(', ')}`);
  } catch (error) {
    console.error('Error setting active middleware:', error);
  }
}

// Get active middleware
async function getActiveMiddleware(client) {
  try {
    const activeJson = await client.get(REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE);
    
    if (!activeJson) {
      return [];
    }
    
    return JSON.parse(activeJson);
  } catch (error) {
    console.error('Error getting active middleware:', error);
    return [];
  }
}

// Display help
function showHelp() {
  console.log(`
Redis Middleware Configuration Utility

Usage:
  node redis-middleware-cli.js [command] [options]

Commands:
  upload              Upload middleware configurations from middleware.json to Redis
  list                List all middleware configurations in Redis
  active [groupName]  Set active middleware from predefined group (standard, minimal, secure)
  show-active         Show currently active middleware
  help                Show this help message

Examples:
  node redis-middleware-cli.js upload
  node redis-middleware-cli.js list
  node redis-middleware-cli.js active standard
  node redis-middleware-cli.js show-active
  `);
}

// Main function
async function main() {
  const command = process.argv[2]?.toLowerCase();
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  let client;
  
  try {
    client = await createRedisClient();
    
    switch (command) {
      case 'upload':
        const configs = await loadConfigFromFile();
        await uploadConfigToRedis(client, configs);
        break;
        
      case 'list':
        const allConfigs = await getAllConfigs(client);
        console.log('Middleware configurations:');
        console.log(JSON.stringify(allConfigs, null, 2));
        break;
        
      case 'active':
        const groupName = process.argv[3]?.toLowerCase();
        
        if (!groupName || !SAMPLE_ACTIVE_MIDDLEWARE[groupName]) {
          console.error('Please specify a valid middleware group (standard, minimal, secure)');
          return;
        }
        
        await setActiveMiddleware(client, SAMPLE_ACTIVE_MIDDLEWARE[groupName]);
        break;
        
      case 'show-active':
        const activeMiddleware = await getActiveMiddleware(client);
        console.log('Currently active middleware:');
        console.log(JSON.stringify(activeMiddleware, null, 2));
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (client) {
      await client.quit();
    }
  }
}

main().catch(console.error);
