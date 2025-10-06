# Dynamic Middleware System for WebSockets

This document explains the dynamic middleware system for WebSocket connections in the Crux Router application.

## Overview

The dynamic middleware system allows middleware components to be:

1. **Loaded dynamically** from files in the `middlewares` directory
2. **Prioritized** to control the execution order
3. **Enabled/disabled** without code changes
4. **Chained** so each middleware can process the request and decide whether to continue

## Architecture

### Core Components

1. **BaseMiddleware**: Abstract class that all middleware classes extend
2. **MiddlewareLoaderService**: Discovers and loads middleware from files
3. **DynamicWsMiddlewareInterceptor**: NestJS interceptor that executes the middleware chain

### Workflow

```
┌───────────┐       ┌───────────────────┐       ┌──────────────────┐
│  Client   │──────▶│  WebSocket Server │──────▶│  Interceptor     │
└───────────┘       └───────────────────┘       └────────┬─────────┘
                                                         │
                                                         ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Middleware Loader Service                      │
├───────────┬───────────┬────────────┬────────────┬────────────┐    │
│ Auth      │ Rate      │ Logging    │ Validation │ Custom     │... │
│ Middleware│ Limiting  │ Middleware │ Middleware │ Middleware │    │
└─────┬─────┴─────┬─────┴─────┬──────┴─────┬──────┴─────┬──────┘    │
      │           │           │            │            │           │
      └───────────┴───────────┴────────────┴────────────┴───────────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │  Handler      │
                         └───────────────┘
```

## Creating Middleware

### 1. Define a Middleware Class

```typescript
import { Injectable } from '@nestjs/common';
import { BaseMiddleware, Middleware } from '../base.middleware';

@Injectable()
@Middleware({ priority: 50, enabled: true })
export class MyCustomMiddleware extends BaseMiddleware {
  async execute(context: any, next: () => Promise<void>): Promise<void> {
    // Pre-processing
    console.log('Before handler');
    
    // Call the next middleware in the chain
    await next();
    
    // Post-processing (after all subsequent middleware have finished)
    console.log('After handler');
  }
}
```

### 2. Save in the Middlewares Directory

Save your middleware class in `src/middleware/middlewares` with a name ending in `.middleware.ts`.

### 3. That's it!

Your middleware will be automatically:
- Discovered and loaded at runtime
- Executed in the priority order specified
- Applied to all WebSocket events

## Middleware Context

Each middleware receives a context object with these properties:

- `client`: The Socket.IO client
- `event`: The event name
- `data`: The event data
- `metadata`: A shared object for middleware to store data for other middleware
- `timestamp`: When the request was received

## Execution Order

Middleware is executed in ascending order of priority:

1. **Authentication Middleware** (priority: 10) - Validates JWT tokens
2. **Rate Limiting Middleware** (priority: 20) - Prevents request flooding
3. **Logging Middleware** (priority: 30) - Logs request details
4. ... (other middleware in priority order)

## Best Practices

1. **Single Responsibility**: Each middleware should do one thing well
2. **Error Handling**: Use try/catch and call `next()` in a finally block for critical middleware
3. **Performance**: Keep middleware lightweight and fast
4. **Priorities**: Use appropriate priority values to ensure correct execution order
5. **Modularity**: Create new middleware files instead of modifying existing ones

## Advanced Usage

### Conditional Middleware Execution

```typescript
async execute(context: any, next: () => Promise<void>): Promise<void> {
  // Skip this middleware for certain events
  if (context.event === 'ping') {
    return next();
  }
  
  // Normal middleware logic
  // ...
  
  await next();
}
```

### Sharing Data Between Middleware

```typescript
async execute(context: any, next: () => Promise<void>): Promise<void> {
  // Store data in context.metadata for other middleware to use
  context.metadata.startTime = Date.now();
  
  await next();
  
  // Can be used for timing, etc.
  const duration = Date.now() - context.metadata.startTime;
}
```

### Blocking Execution

```typescript
async execute(context: any, next: () => Promise<void>): Promise<void> {
  if (!context.client.data.isAuthenticated && context.event !== 'authenticate') {
    // Don't call next() to prevent further middleware execution
    throw new Error('Unauthorized');
    return; // Don't proceed further
  }
  
  await next();
}
```
