# WebSocket Middleware Usage Guide

This guide explains how to use the dynamic middleware system in your WebSocket application.

## Table of Contents

1. [Overview](#overview)
2. [Using Middleware](#using-middleware)
3. [Creating Custom Middleware](#creating-custom-middleware)
4. [Testing with the Client](#testing-with-the-client)
5. [Troubleshooting](#troubleshooting)

## Overview

The middleware system allows you to:

- Apply consistent processing logic across all WebSocket events
- Perform authentication checks
- Validate message formats
- Rate limit requests
- Log activity
- Handle errors consistently

## Using Middleware

### Enabling the Middleware System

To enable the middleware system in your WebSocket gateway:

```typescript
import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { UseInterceptors } from '@nestjs/common';
import { DynamicWsMiddlewareInterceptor } from './middleware/dynamic-ws-middleware.interceptor';

@UseInterceptors(DynamicWsMiddlewareInterceptor)
@WebSocketGateway()
export class YourWebSocketGateway {
  // Your gateway implementation
}
```

### Available Middleware

The following middleware components are included:

1. **ErrorHandlingMiddleware** (priority: 5)
   - Catches errors from other middleware
   - Provides consistent error responses

2. **AuthenticationMiddleware** (priority: 10)
   - Validates JWT tokens
   - Sets authentication data on the socket

3. **RateLimitingMiddleware** (priority: 20)
   - Prevents clients from sending too many messages
   - Configurable limits

4. **LoggingMiddleware** (priority: 30)
   - Logs WebSocket events
   - Records timing information

5. **ValidationMiddleware** (priority: 40)
   - Validates message formats
   - Ensures required fields are present

## Creating Custom Middleware

### 1. Create a New Middleware File

Create a new file in `src/middleware/middlewares` with a name ending in `.middleware.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { BaseMiddleware, Middleware } from '../base.middleware';

@Injectable()
@Middleware({ priority: 50, enabled: true })
export class YourCustomMiddleware extends BaseMiddleware {
  async execute(context: any, next: () => Promise<void>): Promise<void> {
    // Your middleware logic before handler
    console.log('Custom middleware running...');
    
    // Call next middleware in chain
    await next();
    
    // Your middleware logic after handler
    console.log('Custom middleware completed');
  }
}
```

### 2. Middleware Priority

Lower numbers run first. Here's a guide:

- 0-10: Core system middleware (error handling, authentication)
- 11-30: Security middleware (rate limiting, firewall)
- 31-50: Logging and validation
- 51-100: Business logic middleware
- 100+: Non-critical middleware

### 3. Context Object

Your middleware has access to these properties:

```typescript
interface WebSocketContext {
  client: Socket;           // The Socket.IO client
  event: string;            // Event name
  data: any;                // Event data
  timestamp: number;        // Timestamp when received
  metadata: {               // Shared data between middleware
    [key: string]: any;
  };
}
```

### 4. Best Practices

- **Single Responsibility**: Each middleware should do one thing well
- **Error Handling**: Use try/catch blocks and call `next()` in finally blocks for critical middleware
- **Performance**: Keep middleware lightweight and fast
- **Logging**: Use the NestJS logger
- **Context**: Use `context.metadata` to share data between middleware

## Testing with the Client

Use the provided test client (`middleware-test.html`) to test your middleware:

1. Start your NestJS application
2. Open the test client in a browser
3. Connect to your WebSocket server
4. Test various events to see middleware in action

## Troubleshooting

### Common Issues

#### Middleware Not Running

- Check that the middleware file ends with `.middleware.ts`
- Verify the middleware is properly decorated with `@Injectable()` and `@Middleware()`
- Check the console for any loading errors

#### Middleware Order Issues

- Verify priorities are set correctly
- Remember that lower priority numbers run first

#### Error Handling

- Check for uncaught exceptions in middleware
- Make sure the ErrorHandlingMiddleware is registered with priority 5

#### Performance Issues

- Consider disabling non-critical middleware during high load
- Use context.metadata to prevent duplicate work across middleware
