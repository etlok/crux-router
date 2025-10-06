#!/usr/bin/env bash
# deploy.sh - Script to deploy Crux Web Socket to different environments
# Usage: ./deploy.sh [environment] [branch] [remote] [external-redis]
# Example: ./deploy.sh staging feature/middleware-refactor
# Example with external Redis: ./deploy.sh production main origin 192.168.1.100:6379

set -e

# Default values
ENV=${1:-production}
BRANCH=${2:-main}
REMOTE=${3:-origin}
EXTERNAL_REDIS=${4:-""}

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Crux Web Socket Deployment Script ===${NC}"
echo -e "Environment: ${GREEN}$ENV${NC}"
echo -e "Branch: ${GREEN}$BRANCH${NC}"
echo -e "Remote: ${GREEN}$REMOTE${NC}"
echo ""

# Confirm deployment
read -p "Continue with deployment? (y/n): " CONFIRM
if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
  echo -e "${RED}Deployment canceled.${NC}"
  exit 1
fi

# Fetch latest changes
echo -e "\n${YELLOW}Fetching latest changes...${NC}"
git fetch $REMOTE

# Checkout the branch
echo -e "\n${YELLOW}Checking out branch $BRANCH...${NC}"
git checkout $BRANCH || git checkout -b $BRANCH $REMOTE/$BRANCH

# Pull latest changes
echo -e "\n${YELLOW}Pulling latest changes...${NC}"
git pull $REMOTE $BRANCH

# Select the correct docker-compose file
if [[ "$ENV" == "production" ]]; then
  COMPOSE_FILE="docker-compose.prod.yml"
else
  COMPOSE_FILE="docker-compose.yml"
fi

echo -e "\n${YELLOW}Using docker-compose file: $COMPOSE_FILE${NC}"

# Create .env file if it doesn't exist
if [[ ! -f .env ]]; then
  echo -e "\n${YELLOW}Creating .env file...${NC}"
  
  # Set Redis configuration based on external Redis parameter
  REDIS_HOST="redis"
  REDIS_PORT=6379
  USE_INTERNAL_REDIS="true"
  
  if [[ -n "$EXTERNAL_REDIS" ]]; then
    # Parse external Redis connection string (host:port)
    IFS=':' read -r REDIS_HOST REDIS_PORT <<< "$EXTERNAL_REDIS"
    REDIS_PORT=${REDIS_PORT:-6379}
    USE_INTERNAL_REDIS="false"
    echo -e "${YELLOW}Configuring for external Redis at $REDIS_HOST:$REDIS_PORT${NC}"
  fi
  
  cat > .env << EOF
# Environment settings for Crux Web Socket
NODE_ENV=$ENV

# Redis configuration
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT
REDIS_PASSWORD=changeme
USE_INTERNAL_REDIS=$USE_INTERNAL_REDIS

# Kafka configuration
ENABLE_KAFKA=true
KAFKA_HOST=kafka
KAFKA_PORT=9092
KAFKA_BROKER=kafka:9092
KAFKA_CLIENT_ID=crux-app
KAFKA_GROUP_ID=crux-consumer-group
EOF
  echo -e "${GREEN}Created .env file.${NC}"
  echo -e "${YELLOW}Please review .env file and update settings if needed.${NC}"
  read -p "Press Enter to continue..." CONTINUE
fi

# Build and deploy
echo -e "\n${YELLOW}Building and deploying containers...${NC}"
docker-compose -f $COMPOSE_FILE build

# If using external Redis, disable the Redis service in docker-compose
if [[ -n "$EXTERNAL_REDIS" ]]; then
  echo -e "\n${YELLOW}Using external Redis server, disabling internal Redis service...${NC}"
  COMPOSE_HTTP_TIMEOUT=180 docker-compose -f $COMPOSE_FILE up -d --scale redis=0
else
  echo -e "\n${YELLOW}Using internal Redis service...${NC}"
  COMPOSE_HTTP_TIMEOUT=180 docker-compose -f $COMPOSE_FILE up -d
fi

echo -e "\n${GREEN}Deployment completed successfully.${NC}"
echo -e "\nTo view logs: docker-compose -f $COMPOSE_FILE logs -f"
echo -e "To stop services: docker-compose -f $COMPOSE_FILE down"
