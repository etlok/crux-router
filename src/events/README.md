# Events Module

This module provides functionality to process events through configurable middleware chains.

## Overview

The Events Module allows you to:

1. Define middleware configurations in Redis
2. Process events through middleware chains based on configuration
3. Execute actions defined in event payloads

## Components

- **EventProcessorService**: Core service that processes events through middleware and executes actions
- **EventsModule**: NestJS module that provides the EventProcessorService

## Usage

### Processing Events via WebSocket

The WebSocket gateway exposes an `event_processor` endpoint that accepts events for processing.
Events should be structured as:

```json
{
  "event": "event_name",
  "config": {
    // Event configuration
  },
  "middleware": [
    "middleware1",
    "middleware2"
  ],
  "actions": [
    {
      "type": "execute_workflow",
      "workflow": "workflow_name",
      "config": {
        // Workflow configuration
      }
    }
  ]
}
```

### Testing with the Event Processor Test Page

Use the included `event-processor-test.html` page to test event processing:

1. Open the HTML file in a browser
2. Enter a JWT token for authentication
3. Customize the event payload as needed
4. Click "Send Event" to process the event

### Managing Middleware Configurations

Use the Redis CLI utility to manage middleware configurations:

```
# Upload middleware configurations from middleware.json
node src/events/redis-middleware-cli.js upload

# List all middleware configurations
node src/events/redis-middleware-cli.js list

# Set active middleware
node src/events/redis-middleware-cli.js active standard

# Show active middleware
node src/events/redis-middleware-cli.js show-active
```

## Workflow

1. Client sends event to the WebSocket `event_processor` endpoint
2. EventProcessorService processes the event through the specified middleware chain
3. After middleware processing, actions are executed
4. Results are returned to the client

## Integration

The Events Module is integrated with the WebSocket module to handle event processing via WebSockets.
