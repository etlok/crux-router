const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});

async function setupMiddlewareConfiguration() {
  console.log('Setting up middleware configuration in Redis...');
  
  // Define middleware configurations
  const middlewareConfigs = [
    {
      key: 'authentication',
      type: 'class',
      path: 'src/middleware/middlewares/authentication.middleware',
      config: {
        requireAuth: true,
        allowAnonymous: false
      }
    },
    {
      key: 'logging',
      type: 'class',
      path: 'src/middleware/middlewares/logging.middleware',
      config: {
        logLevel: 'info',
        logEvents: true,
        logPayloads: true
      }
    },
    {
      key: 'validation',
      type: 'class',
      path: 'src/middleware/middlewares/validation.middleware',
      config: {
        strictMode: false
      }
    },
    {
      key: 'error-handling',
      type: 'class',
      path: 'src/middleware/middlewares/error-handling.middleware',
      config: {
        logErrors: true,
        sendErrorsToClient: true
      }
    },
    {
      key: 'rate-limiting',
      type: 'class',
      path: 'src/middleware/middlewares/rate-limiting.middleware',
      config: {
        maxRequests: 100,
        windowMs: 60000
      }
    }
  ];

  // Define active middleware list
  const activeMiddleware = ['authentication', 'logging', 'validation', 'error-handling'];
  
  try {
    // Store middleware configurations
    for (const config of middlewareConfigs) {
      await redis.hset(
        'middleware:config:' + config.key,
        'type', config.type,
        'path', config.path,
        'config', JSON.stringify(config.config)
      );
      console.log(`Stored config for middleware: ${config.key}`);
    }
    
    // Store active middleware list
    await redis.del('middleware:active'); // Delete legacy key
    await redis.del('middleware:config:active');
    await redis.set('middleware:config:active', JSON.stringify(activeMiddleware));
    
    console.log(`Stored active middleware list: ${activeMiddleware.join(', ')}`);
    console.log('Middleware configuration setup complete!');
    
  } catch (error) {
    console.error('Error setting up middleware configuration:', error);
  } finally {
    // Close the Redis connection
    redis.quit();
  }
}

// Run the setup
setupMiddlewareConfiguration();
