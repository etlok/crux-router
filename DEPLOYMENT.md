# Crux Web Socket

Event processing system with middleware pipeline, workflow management, and worker assignment.

## Architecture Overview

This system processes events through a middleware pipeline, matches them to workflow definitions, and assigns steps to worker instances. For a complete visual overview of the data flow, see `docs/event-processing-flow.html`.

## Redis Data Structures

The system uses Redis for storing:
- Middleware configurations
- Workflow definitions
- Workflow instances
- Worker registry and status

For details on Redis key structures, review `docs/event-processing-flow.md`.

## Deployment Options

### Local Development

```bash
# Start all services for development
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production Deployment

```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Or use the deployment script
./deploy.sh production main
```

### Branch Deployment

To deploy from a specific branch:

```bash
./deploy.sh [environment] [branch] [remote] [external-redis]

# Examples:
./deploy.sh staging feature/middleware-refactor
./deploy.sh testing experimental
./deploy.sh production main origin 192.168.1.100:6379
```

### External Redis Configuration

If you want to connect to an existing Redis server instead of starting one with Docker:

```bash
# Deploy with external Redis
./deploy.sh production main origin 192.168.1.100:6379

# Or set environment variables manually
export REDIS_HOST=192.168.1.100
export REDIS_PORT=6379
export USE_INTERNAL_REDIS=false
docker-compose up -d --scale redis=0
```

## Configuration

Environment variables can be set in `.env` file or directly in docker-compose files:

| Variable | Description | Default |
|----------|-------------|---------|
| REDIS_HOST | Redis server hostname | redis |
| REDIS_PORT | Redis server port | 6379 |
| REDIS_PASSWORD | Redis password (prod only) | changeme |
| ENABLE_KAFKA | Enable Kafka integration | true |
| KAFKA_HOST | Kafka broker hostname | kafka |
| KAFKA_PORT | Kafka broker port | 9092 |
| KAFKA_CLIENT_ID | Kafka client ID | crux-app |

## Middleware Configuration

The middleware system can be configured through Redis. Use these scripts:

```bash
# Fix middleware configuration in Redis
node fix-middleware-config.js

# Verify middleware keys in Redis
node verify-middleware-keys.js
```

## Monitoring

The application exposes:
- HTTP API on port 3000
- WebSocket server on port 3001

Health endpoint: `GET /health`

## Container Architecture

The system consists of two main containers:
1. **App** - Main application that runs the WebSocket, API, and Kafka consumers
2. **Worker** - Worker instances that execute workflow steps

Supporting containers:
- Redis - For data storage and pub/sub
- Kafka and Zookeeper - For event stream processing

## Migration Guide

When migrating to a new branch or environment:

1. Clone the repository
2. Check out the desired branch
3. Run `./deploy.sh [environment] [branch]`
4. Verify that Redis data structures are properly set up
5. Monitor logs for any issues

For Redis data migration, use the included Redis tools in the `src/middleware` directory.
