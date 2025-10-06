/**
 * Redis Middleware Configuration Fixer
 * 
 * This script fixes any issues with Redis middleware configuration keys.
 */

const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

async function fixMiddlewareConfig() {
  console.log('Checking middleware configuration in Redis...');
  
  try {
    // Clean up any existing keys to avoid type conflicts
    await redis.del('middleware:active'); // Delete legacy key
    await redis.del('middleware:config:active');
    
    // Define the standard key name from the interface
    const ACTIVE_MIDDLEWARE_KEY = 'middleware:config:active';
    
    // Check if we have middleware in JSON format
    const activeJson = await redis.get(ACTIVE_MIDDLEWARE_KEY);
    console.log(`${ACTIVE_MIDDLEWARE_KEY} exists: ${activeJson ? 'yes' : 'no'}`);
    
    // Create default middleware configuration
    let middlewareKeys = ['authentication', 'logging'];
    
    // Use existing configuration if available
    if (activeJson) {
      try {
        const parsed = JSON.parse(activeJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          middlewareKeys = parsed;
          console.log(`Using existing middleware configuration: ${middlewareKeys.join(', ')}`);
        }
      } catch (e) {
        console.log(`Error parsing ${ACTIVE_MIDDLEWARE_KEY} value:`, e.message);
      }
    }
    
    // Store middleware keys as JSON string
    await redis.set(ACTIVE_MIDDLEWARE_KEY, JSON.stringify(middlewareKeys));
    console.log(`Set active middleware: ${middlewareKeys.join(', ')}`);
    
    
    // Ensure we have a middleware config list as a Set
    await redis.del('middleware:config:list');
    
    // Add default middleware configs
    const defaultConfigs = ['authentication', 'logging', 'validation', 'rate-limiting', 'error-handling'];
    for (const key of defaultConfigs) {
      await redis.sadd('middleware:config:list', key);
    }
    console.log(`Added default middleware configs: ${defaultConfigs.join(', ')}`);
    
    // Ensure middleware configurations exist for common middleware
    for (const key of defaultConfigs) {
      const configKey = `middleware:config:item:${key}`;
      
      // Delete existing config to avoid type conflicts
      await redis.del(configKey);
      
      console.log(`Creating configuration for ${key}...`);
      
      const defaultConfig = {
        key,
        type: 'class',
        path: `src/middleware/middlewares/${key}.middleware.ts`,
        config: {}
      };
      
      await redis.set(configKey, JSON.stringify(defaultConfig));
    }
    
    console.log('Middleware configuration check complete.');
  } catch (error) {
    console.error('Error fixing middleware configuration:', error);
  } finally {
    redis.disconnect();
  }
}

fixMiddlewareConfig();
