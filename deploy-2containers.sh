#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-development}
BRANCH=${2:-main}

echo -e "${BLUE}🚀 Deploying Crux WebSocket Router (2-Container Setup)${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Branch: ${BRANCH}${NC}"
echo "=============================================="

# Function to create .env file
create_env_file() {
    echo -e "${YELLOW}📝 Creating environment file...${NC}"
    
    cat > .env << EOF
# Environment
NODE_ENV=${ENVIRONMENT}

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Application Ports
PORT=3000
WS_PORT=3001

# Logging
LOG_LEVEL=info
EOF
    
    echo -e "${GREEN}✅ Environment file created${NC}"
}

# Function to checkout branch
checkout_branch() {
    if [ "$BRANCH" != "$(git rev-parse --abbrev-ref HEAD)" ]; then
        echo -e "${YELLOW}🔄 Checking out branch: ${BRANCH}${NC}"
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
    else
        echo -e "${GREEN}✅ Already on branch: ${BRANCH}${NC}"
    fi
}

# Function to clean up old containers
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up old containers...${NC}"
    
    docker-compose -f docker-compose.2containers.yml down --remove-orphans || true
    docker system prune -f || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to build and start containers
deploy() {
    echo -e "${YELLOW}🏗️ Building and starting containers...${NC}"
    
    # Build and start containers
    docker-compose -f docker-compose.2containers.yml up -d --build
    
    echo -e "${GREEN}✅ Containers started successfully${NC}"
}

# Function to check container health
check_health() {
    echo -e "${YELLOW}🔍 Checking container health...${NC}"
    
    # Wait for containers to be healthy
    timeout=120
    counter=0
    
    while [ $counter -lt $timeout ]; do
        redis_health=$(docker inspect --format='{{.State.Health.Status}}' crux-redis 2>/dev/null || echo "unknown")
        router_health=$(docker inspect --format='{{.State.Health.Status}}' crux-router 2>/dev/null || echo "unknown")
        
        if [ "$redis_health" = "healthy" ] && [ "$router_health" = "healthy" ]; then
            echo -e "${GREEN}✅ All containers are healthy!${NC}"
            return 0
        fi
        
        echo "Redis: $redis_health, Router: $router_health (${counter}s/${timeout}s)"
        sleep 5
        counter=$((counter + 5))
    done
    
    echo -e "${RED}❌ Health check timeout${NC}"
    return 1
}

# Function to show deployment status
show_status() {
    echo -e "${BLUE}📊 Deployment Status${NC}"
    echo "=============================================="
    
    docker-compose -f docker-compose.2containers.yml ps
    
    echo ""
    echo -e "${GREEN}🌐 Application URLs:${NC}"
    echo "  HTTP API: http://localhost:3000"
    echo "  WebSocket: ws://localhost:3001"
    echo "  Health Check: http://localhost:3000/health"
    echo "  Flow Documentation: http://localhost:3000/docs/event-processing-flow.html"
    echo ""
    echo -e "${GREEN}🔧 Useful Commands:${NC}"
    echo "  View logs: docker-compose -f docker-compose.2containers.yml logs -f"
    echo "  Stop: docker-compose -f docker-compose.2containers.yml down"
    echo "  Restart router: docker-compose -f docker-compose.2containers.yml restart router"
    echo "  Redis CLI: docker exec -it crux-redis redis-cli"
}

# Main deployment flow
main() {
    create_env_file
    checkout_branch
    cleanup
    deploy
    
    if check_health; then
        show_status
        echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    else
        echo -e "${RED}❌ Deployment failed - check container logs${NC}"
        docker-compose -f docker-compose.2containers.yml logs
        exit 1
    fi
}

# Run main function
main