#!/usr/bin/env node

/**
 * Middleware Redis Keys Verification Script
 * 
 * This script checks and reports on the Redis middleware keys to ensure they are correctly formatted.
 * It will list all middleware-related keys and their types to help diagnose any type conflicts.
 */

const Redis = require('ioredis');

// Configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// Define the standard keys we expect
const REDIS_MIDDLEWARE_KEYS = {
  CONFIG_LIST: 'middleware:config:list',
  CONFIG_ITEM_PREFIX: 'middleware:config:item:',
  ACTIVE_MIDDLEWARE: 'middleware:config:active',
  LEGACY_ACTIVE: 'middleware:active' // Old key name for reference
};

async function verifyMiddlewareKeys() {
  console.log('===== Middleware Redis Keys Verification =====\n');
  
  try {
    // List all keys related to middleware
    const middlewareKeys = await redis.keys('middleware:*');
    console.log(`Found ${middlewareKeys.length} middleware-related keys in Redis`);
    
    // Check each key and verify its type
    for (const key of middlewareKeys) {
      const type = await redis.type(key);
      const keyInfo = { key, type };
      
      // Get more info depending on the type
      if (type === 'string') {
        const value = await redis.get(key);
        try {
          const parsed = JSON.parse(value);
          keyInfo.isValidJson = true;
          keyInfo.jsonType = Array.isArray(parsed) ? 'array' : typeof parsed;
          keyInfo.length = Array.isArray(parsed) ? parsed.length : null;
        } catch (e) {
          keyInfo.isValidJson = false;
          keyInfo.valuePreview = value.substring(0, 30) + (value.length > 30 ? '...' : '');
        }
      } else if (type === 'list') {
        keyInfo.length = await redis.llen(key);
        if (keyInfo.length > 0 && keyInfo.length < 10) {
          keyInfo.items = await redis.lrange(key, 0, -1);
        }
      } else if (type === 'set') {
        keyInfo.cardinality = await redis.scard(key);
        if (keyInfo.cardinality > 0 && keyInfo.cardinality < 10) {
          keyInfo.members = await redis.smembers(key);
        }
      } else if (type === 'hash') {
        keyInfo.fields = await redis.hkeys(key);
      }
      
      // Check for known keys
      if (key === REDIS_MIDDLEWARE_KEYS.CONFIG_LIST) {
        console.log('\n=== Configuration List Key ===');
      } else if (key === REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE) {
        console.log('\n=== Active Middleware Key ===');
      } else if (key === REDIS_MIDDLEWARE_KEYS.LEGACY_ACTIVE) {
        console.log('\n=== LEGACY Active Middleware Key (should be removed) ===');
      } else if (key.startsWith(REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX)) {
        console.log(`\n=== Middleware Config: ${key.substring(REDIS_MIDDLEWARE_KEYS.CONFIG_ITEM_PREFIX.length)} ===`);
      } else {
        console.log(`\n=== Unknown Middleware Key: ${key} ===`);
      }
      
      console.log(JSON.stringify(keyInfo, null, 2));
    }
    
    console.log('\n===== Verification Summary =====');
    
    // Check that the active middleware key exists and is a JSON string
    const activeMiddlewareExists = await redis.exists(REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE);
    if (activeMiddlewareExists) {
      const activeType = await redis.type(REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE);
      if (activeType === 'string') {
        const activeValue = await redis.get(REDIS_MIDDLEWARE_KEYS.ACTIVE_MIDDLEWARE);
        try {
          const activeArray = JSON.parse(activeValue);
          if (Array.isArray(activeArray)) {
            console.log(`✅ Active middleware key exists and is properly formatted as a JSON array with ${activeArray.length} items`);
          } else {
            console.log(`❌ Active middleware key exists but the parsed JSON is not an array!`);
          }
        } catch (e) {
          console.log(`❌ Active middleware key exists but contains invalid JSON!`);
        }
      } else {
        console.log(`❌ Active middleware key exists but is of type '${activeType}' instead of 'string'!`);
      }
    } else {
      console.log(`❌ Active middleware key does not exist!`);
    }
    
    // Check for legacy key
    const legacyExists = await redis.exists(REDIS_MIDDLEWARE_KEYS.LEGACY_ACTIVE);
    if (legacyExists) {
      console.log(`⚠️ Legacy active middleware key 'middleware:active' still exists and should be removed`);
    } else {
      console.log(`✅ Legacy active middleware key has been properly removed`);
    }
    
    // Check the config list
    const configListExists = await redis.exists(REDIS_MIDDLEWARE_KEYS.CONFIG_LIST);
    if (configListExists) {
      const configListType = await redis.type(REDIS_MIDDLEWARE_KEYS.CONFIG_LIST);
      if (configListType === 'set') {
        const configCount = await redis.scard(REDIS_MIDDLEWARE_KEYS.CONFIG_LIST);
        console.log(`✅ Configuration list exists and is properly formatted as a set with ${configCount} items`);
      } else {
        console.log(`❌ Configuration list exists but is of type '${configListType}' instead of 'set'!`);
      }
    } else {
      console.log(`❌ Configuration list key does not exist!`);
    }
    
    console.log('\n===== Recommended Actions =====');
    console.log('1. Run fix-middleware-config.js to ensure proper middleware configuration');
    console.log('2. Restart the application to reload middleware configurations');
    
  } catch (error) {
    console.error('Error verifying middleware keys:', error);
  } finally {
    redis.disconnect();
  }
}

verifyMiddlewareKeys().catch(console.error);
