# Crux Middleware Management System

This system allows users to create, manage, and test custom middleware in the Crux application.

## Getting Started

1. Visit `/middleware-manager` in your browser to access the middleware management interface
2. Use the templates to create your first middleware
3. Test your middleware before deploying it to production

## Middleware Structure

Each middleware should export an object with an `execute` method:

```javascript
module.exports = {
  async execute(context, next) {
    // Middleware code here
    
    // Call next() to continue to next middleware
    await next();
    
    // This code runs after downstream middleware complete
  }
};
```

## Context Object

The `context` object contains information about the current event:

- `event`: The name of the event
- `data`: The event payload
- `sourceContext`: Information about the source (user, client, etc.)
- `metadata`: Additional metadata including middleware results

## Configuration

Each middleware can have its own configuration, which is accessible in the middleware code via the global `config` variable.

## Best Practices

1. Always call `next()` unless you want to halt the middleware chain
2. Handle errors properly
3. Add your middleware's results to `context.metadata.middlewareResults`
4. Keep middleware focused on a single responsibility
5. Use descriptive names for your middleware

## Built-in Middleware

The system includes several built-in middleware:

- **authentication**: Verifies user authentication
- **validation**: Validates event data
- **logging**: Logs event information
- **rate-limiting**: Prevents abuse by limiting request frequency
- **error-handling**: Catches and processes errors

## Testing Your Middleware

Before deploying middleware to production:

1. Use the Test tab in the middleware manager
2. Create a realistic test context
3. Test individual middleware and entire middleware chains
4. Check the resulting context to ensure your middleware works as expected

## Security Considerations

- Middleware runs in a sandboxed environment with limited access to system resources
- Only certain safe modules can be required (`uuid`, `crypto`, `lodash`, `jsonwebtoken`)
- Code is validated before being saved and executed
- Rate limits apply to middleware execution

## Middleware Priority

Lower numbers run first. Some examples:

- **10**: Authentication (must run early)
- **20**: Logging (should capture all events)
- **50**: Validation (before business logic)
- **100**: Default priority
- **200+**: Post-processing middleware
