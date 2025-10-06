/**
 * Sample Middleware Template
 * 
 * This middleware provides a basic example of how to implement a custom middleware.
 */
module.exports = {
  /**
   * Execute the middleware
   * @param {Object} context - The event context
   * @param {Function} next - Call to proceed to next middleware
   */
  async execute(context, next) {
    // Log when the middleware begins execution
    console.log(`[Sample Middleware] Processing event: ${context.event}`);
    
    // Access the configuration
    const { includeTimestamp = true } = config;
    
    // Add data to the context
    context.metadata = context.metadata || {};
    context.metadata.sample = {
      processedBy: 'sample-middleware',
      timestamp: includeTimestamp ? new Date().toISOString() : undefined
    };
    
    // Store in middleware results for tracking
    if (context.metadata.middlewareResults) {
      context.metadata.middlewareResults.sample = {
        processed: true,
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Continue to the next middleware
      await next();
      
      // This code executes after all subsequent middleware
      console.log(`[Sample Middleware] Chain completed for event: ${context.event}`);
    } catch (error) {
      // Handle errors from subsequent middleware
      console.error(`[Sample Middleware] Error in middleware chain: ${error.message}`);
      
      // Update the results
      if (context.metadata.middlewareResults && context.metadata.middlewareResults.sample) {
        context.metadata.middlewareResults.sample.error = error.message;
      }
      
      // Re-throw the error to propagate it
      throw error;
    }
  }
};
