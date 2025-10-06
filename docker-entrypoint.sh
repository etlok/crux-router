#!/bin/sh

# docker-entrypoint.sh - Setup and run the Crux Web Socket server
set -e

echo "=== Starting Crux Web Socket Server ==="

# Wait for Redis to be available
echo "Waiting for Redis to be available at ${REDIS_HOST:-redis}:${REDIS_PORT:-6379}..."
timeout=30
while ! nc -z ${REDIS_HOST:-redis} ${REDIS_PORT:-6379} > /dev/null 2>&1; do
  timeout=$((timeout - 1))
  if [ $timeout -eq 0 ]; then
    echo "Redis connection timed out. Please ensure Redis is running and accessible."
    echo "If connecting to an external Redis server, check REDIS_HOST and REDIS_PORT environment variables."
    exit 1
  fi
  echo "Waiting for Redis connection... ($timeout seconds remaining)"
  sleep 1
done
echo "Redis is available!"

# Initialize middleware configuration
echo "Initializing middleware configuration..."
node fix-middleware-config.js

# Verify middleware configuration
echo "Verifying middleware configuration..."
node verify-middleware-keys.js

# If Kafka is enabled, wait for it
if [ "${ENABLE_KAFKA}" = "true" ]; then
  echo "Kafka is enabled, waiting for Kafka to be available..."
  timeout=30
  while ! nc -z ${KAFKA_HOST:-kafka} ${KAFKA_PORT:-9092} > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
      echo "Kafka connection timed out"
      exit 1
    fi
    echo "Waiting for Kafka connection... ($timeout seconds remaining)"
    sleep 1
  done
  echo "Kafka is available!"
fi

# Execute the command passed as argument (or the default)
echo "Starting application with command: $@"
exec "$@"
