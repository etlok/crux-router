#!/bin/bash
# use-external-redis.sh - Script to configure the application to use an external Redis server
# Usage: ./use-external-redis.sh <redis-host> [redis-port]

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Redis host is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Redis host not provided.${NC}"
  echo -e "Usage: ./use-external-redis.sh <redis-host> [redis-port]"
  echo -e "Example: ./use-external-redis.sh 192.168.1.100 6379"
  exit 1
fi

REDIS_HOST=$1
REDIS_PORT=${2:-6379}

echo -e "${YELLOW}Configuring application to use external Redis at ${REDIS_HOST}:${REDIS_PORT}${NC}"

# Create or update .env file
if [ -f ".env" ]; then
  # Update existing .env file
  sed -i "s/^REDIS_HOST=.*/REDIS_HOST=$REDIS_HOST/" .env
  sed -i "s/^REDIS_PORT=.*/REDIS_PORT=$REDIS_PORT/" .env
  sed -i "s/^USE_INTERNAL_REDIS=.*/USE_INTERNAL_REDIS=false/" .env
  
  # Add USE_INTERNAL_REDIS if it doesn't exist
  if ! grep -q "USE_INTERNAL_REDIS" .env; then
    echo "USE_INTERNAL_REDIS=false" >> .env
  fi
else
  # Create new .env file
  cat > .env << EOF
# Environment settings for Crux Web Socket
NODE_ENV=development

# Redis configuration
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT
USE_INTERNAL_REDIS=false

# Kafka configuration
ENABLE_KAFKA=true
KAFKA_HOST=kafka
KAFKA_PORT=9092
KAFKA_BROKER=kafka:9092
KAFKA_CLIENT_ID=crux-app
KAFKA_GROUP_ID=crux-consumer-group
EOF
fi

echo -e "${GREEN}Configuration updated.${NC}"
echo -e "To start the application without the internal Redis:"
echo -e "  ${YELLOW}docker-compose up -d --scale redis=0${NC}"
echo -e "Or using the deploy script:"
echo -e "  ${YELLOW}./deploy.sh development feature/initialize origin ${REDIS_HOST}:${REDIS_PORT}${NC}"

# Test Redis connection
echo -e "\n${YELLOW}Testing connection to Redis...${NC}"
if command -v redis-cli &> /dev/null; then
  if redis-cli -h $REDIS_HOST -p $REDIS_PORT ping; then
    echo -e "${GREEN}Successfully connected to Redis!${NC}"
  else
    echo -e "${RED}Failed to connect to Redis. Please check your Redis host and port.${NC}"
  fi
else
  echo -e "${YELLOW}redis-cli not found. Skipping connection test.${NC}"
  echo -e "Install redis-cli to test the connection: apt-get install redis-tools"
fi
