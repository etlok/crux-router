# Custom Middleware Directory

This directory contains user-defined middleware files that are loaded dynamically by the middleware loader.

## Structure

Each middleware file should be named according to its key, e.g., `validation.js` for a middleware with key `validation`.

## Implementation

Each middleware should export an object with an `execute` method:

```javascript
module.exports = {
  /**
   * Execute the middleware
   * @param {Object} context - The event context
   * @param {Function} next - Call to proceed to next middleware
   */
  async execute(context, next) {
    // Your middleware logic here
    
    // Call next() to continue to the next middleware
    await next();
    
    // Code here runs after all subsequent middleware have executed
  }
};
```

## Configuration

Middleware configuration is stored separately in Redis and can be managed through the middleware management API.

## Built-in Variables

Inside your middleware, you have access to:

- `console` - For logging
- `config` - The middleware configuration object

## Best Practices

1. Always call `next()` unless you intentionally want to halt the middleware chain
2. Handle errors properly
3. Don't perform heavy or blocking operations
4. Keep middleware focused on a single responsibility
5. Document your middleware code with comments
