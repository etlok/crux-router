# Middleware Systems Guide

This document explains the middleware systems available in your NestJS application.

## Overview

The middleware system consists of two main components:

1. **Authentication Middleware System** - Basic authentication for HTTP and WebSocket
2. **Dynamic Middleware System** - Advanced, file-based middleware for WebSocket

## Authentication Middleware System

The authentication middleware system consists of:

1. **HTTP Authentication Middleware** - for REST APIs
2. **WebSocket Authentication Middleware** - for WebSocket connections

## Dynamic Middleware System

For more flexible and advanced WebSocket middleware handling, we've implemented a dynamic middleware system that:

1. **Loads middleware from files** - Discovers and loads middleware components at runtime
2. **Prioritizes middleware** - Executes middleware in a defined order
3. **Chains middleware execution** - Allows each middleware to decide whether to continue
4. **Shares context** - Provides a shared context object for middleware to use

For full documentation of the dynamic system, see:
- [DYNAMIC-MIDDLEWARE.md](./DYNAMIC-MIDDLEWARE.md) - Architecture and concepts
- [MIDDLEWARE-USAGE-GUIDE.md](./MIDDLEWARE-USAGE-GUIDE.md) - How to use and extend
3. **WebSocket Authentication Interceptor** - processes every incoming WebSocket message
4. **Auth Guards** - for protecting specific routes or WebSocket handlers

## HTTP Authentication

### AuthMiddleware

The `AuthMiddleware` handles JWT token validation for HTTP requests. It extracts the token from various places:

- Authorization header (`Bearer` token)
- Query parameters (`?token=xyz`)
- Request body (`auth.token`)
- Cookies (`token`)

### Usage in Controllers

The middleware automatically sets these properties on the request:

- `req.user` - The decoded JWT payload if authenticated, or `null`
- `req.isAuthenticated` - `true` if authenticated, `false` otherwise
- `req.token` - The original token string if provided
- `req.authError` - Error message if authentication failed

You can use these in your controller methods:

```typescript
@Controller('example')
export class ExampleController {
  @Get('user-data')
  getData(@Req() req) {
    if (req.isAuthenticated) {
      return { message: `Hello ${req.user.name}` };
    } else {
      return { message: 'Hello anonymous user' };
    }
  }
}
```

### Protecting Routes with AuthGuard

Use the `AuthGuard` to protect routes that require authentication:

```typescript
@Controller('api')
export class ApiController {
  // Public endpoint - anyone can access
  @Get('public')
  public() {
    return { message: 'This is public' };
  }
  
  // Protected endpoint - only authenticated users can access
  @UseGuards(AuthGuard)
  @Get('protected')
  protected() {
    return { message: 'This is protected' };
  }
}
```

## WebSocket Authentication

### Automatic Authentication for All Events

The WebSocket authentication system automatically processes every incoming message using the `WsAuthInterceptor`. This means that authentication happens for every event sent by clients, providing a true middleware layer between clients and your backend.

### How It Works

1. **Initial Connection**: When a client first connects, `WsAuthMiddleware` authenticates them using any provided token
2. **Every Message**: Each time a client sends a message, the `WsAuthInterceptor` re-authenticates them
3. **Protection**: Specific handlers can be protected with the `WsAuthGuard` to restrict access

This approach ensures that:
- Authentication status is always current
- Revoked tokens are detected immediately
- Clients can't bypass authentication for protected events

### WsAuthMiddleware

The `WsAuthMiddleware` handles authentication for WebSocket connections. It works with tokens from:

- Socket.IO auth object (`socket.handshake.auth.token`)
- Headers (`socket.handshake.headers.authorization`)
- Query params (`socket.handshake.query.token`)
- Cookies

### Data Available After Authentication

The middleware sets these properties on the socket:

- `client.data.user` - The decoded JWT payload if authenticated, or `null`
- `client.data.isAuthenticated` - `true` if authenticated, `false` otherwise
- `client.data.token` - The original token string if provided
- `client.data.authError` - Error message if authentication failed
- `client.data.userId` - Shorthand for `user.sub` or `user.id`
- `client.data.authTime` - Timestamp when authentication occurred

### Usage in Gateways

Configure your gateway to use the interceptor:

```typescript
@WebSocketGateway()
@UseInterceptors(WsAuthInterceptor) // Apply to all message handlers
export class ExampleGateway {
  constructor(private wsAuthMiddleware: WsAuthMiddleware) {}
  
  async handleConnection(client: Socket) {
    // Initial authentication on connection
    const user = await this.wsAuthMiddleware.authenticate(client);
    
    if (user) {
      console.log(`Authenticated user connected: ${user.name}`);
    }
  }
}
```

### Protecting WebSocket Handlers

Use the `WsAuthGuard` to protect WebSocket message handlers:

```typescript
@WebSocketGateway()
@UseInterceptors(WsAuthInterceptor) // Global authentication for all handlers
export class ExampleGateway {
  // Public handler - anyone can call
  @SubscribeMessage('publicEvent')
  handlePublicEvent(@ConnectedSocket() client: Socket) {
    // You can still check auth status manually
    const userGreeting = client.data.user 
      ? `Hello ${client.data.user.name}` 
      : 'Hello anonymous user';
      
    return { status: 'ok', greeting: userGreeting };
  }
  
  // Protected handler - only authenticated clients can call
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('protectedEvent')
  handleProtectedEvent() {
    // Only authenticated clients can reach here
    return { status: 'ok', message: 'This is protected' };
  }
}
```

The authentication flow ensures that:

1. Every message is processed by the interceptor first
2. The client's authentication status is verified and updated
3. Guards can block access to protected handlers
4. Your handler code can focus on business logic
```

## Best Practices

1. Always use guards for sensitive operations
2. Don't rely on client-provided data for authorization decisions
3. Implement proper role/permission checks for fine-grained access control
4. Regularly rotate JWT secrets
5. Set appropriate token expiration times
6. Consider caching authentication results for high-volume systems

## Authentication Flow Diagram

```
┌─────────┐         ┌───────────────┐         ┌─────────────┐         ┌─────────┐
│  Client │         │  WS Interceptor │         │  Middleware │         │  Handler │
│         │         │                 │         │             │         │         │
└────┬────┘         └────────┬────────┘         └──────┬──────┘         └────┬────┘
     │                       │                         │                      │
     │ Send Event            │                         │                      │
     │──────────────────────>│                         │                      │
     │                       │ authenticate()          │                      │
     │                       │────────────────────────>│                      │
     │                       │                         │                      │
     │                       │ User/Auth Status        │                      │
     │                       │<────────────────────────│                      │
     │                       │                         │                      │
     │                       │ Check Guards            │                      │
     │                       │─────────────┐           │                      │
     │                       │             │           │                      │
     │                       │<────────────┘           │                      │
     │                       │                         │                      │
     │                       │ Forward to Handler      │                      │
     │                       │─────────────────────────────────────────────────>
     │                       │                         │                      │
     │                       │                         │                      │ Process
     │                       │                         │                      │ Event
     │                       │                         │                      │──────┐
     │                       │                         │                      │      │
     │                       │                         │                      │<─────┘
     │                       │                         │                      │
     │ Response              │                         │                      │
     │<───────────────────────────────────────────────────────────────────────┘
     │                       │                         │                      │
```

This architecture provides a seamless authentication layer that processes every message while maintaining high performance.
