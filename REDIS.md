# Redis Connection Options

Crux Web Socket provides flexible options for Redis connectivity, allowing you to either use the included Redis container or connect to an existing Redis server.

## Using the Built-in Redis Container

By default, the Docker Compose configuration includes a Redis container:

```bash
docker-compose up -d
```

This will start Redis on port 6379 with data persistence configured.

## Connecting to an External Redis Server

If you already have a Redis server running, you can configure the application to connect to it instead:

### Option 1: Using the Helper Script

```bash
# Configure to use external Redis
./use-external-redis.sh 192.168.1.100 6379

# Start application without Redis container
docker-compose up -d --scale redis=0
```

### Option 2: Using Environment Variables

```bash
# Set environment variables
export REDIS_HOST=192.168.1.100
export REDIS_PORT=6379
export USE_INTERNAL_REDIS=false

# Start application without Redis container
docker-compose up -d --scale redis=0
```

### Option 3: Using the Deploy Script

```bash
# Format: ./deploy.sh [environment] [branch] [remote] [external-redis]
./deploy.sh production main origin 192.168.1.100:6379
```

## Redis Data Structures

The application uses several Redis data structures for different purposes:

1. **Middleware Configuration**:
   - `middleware:config:active` - Active middleware list
   - `middleware:config:item:<name>` - Individual middleware configuration
   - `middleware:config:list` - List of available middleware

2. **Workflow Management**:
   - `workflow:definition:<event-type>` - Workflow definitions
   - `workflow:instance:<id>` - Workflow instances

3. **Worker Registry**:
   - `workers:available` - Available worker instances
   - `worker:details:<id>` - Worker capabilities and status
   - `worker:status:<id>` - Current worker status

For more details on Redis data structures, see the [Event Processing Flow](./docs/event-processing-flow.md) documentation.
