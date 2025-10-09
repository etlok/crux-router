# Stage 1: Build
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the code and build
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:18-alpine

# Set environment to production
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/docs ./docs

# Copy scripts needed for middleware and workflow setup
COPY fix-middleware-config.js ./
COPY verify-middleware-keys.js ./
COPY src/middleware/setup-middleware-config.js ./setup-middleware-config.js
COPY src/middleware/inspect-redis-middleware.js ./inspect-redis-middleware.js

# Create logs directory and set permissions
RUN mkdir -p logs && chmod 777 logs

# Expose ports for HTTP and WebSockets
EXPOSE 3000 3001

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Run the entrypoint script by default
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default command if no arguments passed to entrypoint
CMD ["node", "dist/main.js"]