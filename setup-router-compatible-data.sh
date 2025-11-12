#!/bin/bash

# Redis Sample Data Setup - Compatible with RouterService Logic
# Run this script on your Amazon Linux instance where Redis is running

echo "Setting up sample data compatible with RouterService logic..."

# 1. Workflow Definition (matches your routeEvent fetch logic)
redis-cli SET "workflow:create_entity" '{
  "id": "create_entity",
  "name": "Create Entity Workflow", 
  "description": "Workflow for creating new entities in the system",
  "version": "1.0",
  "status": "active",
  "steps": [
    {
      "type": "validation",
      "class": "EntityValidationStep",
      "config": {
        "required_fields": ["name", "type", "attributes"],
        "validation_rules": {
          "name": {"min_length": 1, "max_length": 100},
          "type": {"allowed_values": ["user", "product", "order", "category"]}
        }
      }
    },
    {
      "type": "processing", 
      "class": "EntityProcessingStep",
      "config": {
        "database_operation": "create",
        "table": "entities",
        "generate_id": true,
        "timestamps": true
      }
    },
    {
      "type": "notification",
      "class": "EntityNotificationStep", 
      "config": {
        "notification_type": "websocket",
        "channels": ["entity_created", "admin_notifications"],
        "include_entity_data": true
      }
    }
  ],
  "hooks": {
    "on_start": {},
    "on_complete": {
      "webhook_url": "https://api.example.com/webhooks/workflow-complete"
    },
    "on_failure": {
      "notification_channels": ["error_alerts"],
      "retry_policy": "exponential_backoff"
    }
  },
  "created_at": "2025-10-15T10:30:00Z"
}'

echo "✓ Workflow definition created"

# 2. Worker Assignment for Workflow (Hash method - preferred by your router)
redis-cli HSET "workflow:create_entity:workers" \
  "validation_worker" "active" \
  "processing_worker" "active" \
  "notification_worker" "active"

# 3. Worker Assignment for Workflow (Set method - fallback)
redis-cli SADD "workflow:create_entity:worker_list" \
  "validation_worker" \
  "processing_worker" \
  "notification_worker"

echo "✓ Workflow worker assignments created"

# 4. Worker Component Instances (matches your crux:component pattern)

# Validation Worker Instances
redis-cli SADD "crux:component:validation_worker:instances" \
  "crux:component:validation_worker:instance:001" \
  "crux:component:validation_worker:instance:002"

# Validation Worker Instance 001
redis-cli HSET "crux:component:validation_worker:instance:001" \
  "worker_id" "validation_worker" \
  "instance_id" "crux:component:validation_worker:instance:001" \
  "status" "online" \
  "thread_capacity" "10" \
  "current_thread_count" "2" \
  "hostname" "validation-node-01" \
  "port" "3001" \
  "started_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "last_heartbeat" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Validation Worker Instance 002  
redis-cli HSET "crux:component:validation_worker:instance:002" \
  "worker_id" "validation_worker" \
  "instance_id" "crux:component:validation_worker:instance:002" \
  "status" "online" \
  "thread_capacity" "10" \
  "current_thread_count" "0" \
  "hostname" "validation-node-02" \
  "port" "3001" \
  "started_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "last_heartbeat" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Processing Worker Instances
redis-cli SADD "crux:component:processing_worker:instances" \
  "crux:component:processing_worker:instance:001"

redis-cli HSET "crux:component:processing_worker:instance:001" \
  "worker_id" "processing_worker" \
  "instance_id" "crux:component:processing_worker:instance:001" \
  "status" "online" \
  "thread_capacity" "8" \
  "current_thread_count" "1" \
  "hostname" "processing-node-01" \
  "port" "3002" \
  "started_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "last_heartbeat" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Notification Worker Instances
redis-cli SADD "crux:component:notification_worker:instances" \
  "crux:component:notification_worker:instance:001" \
  "crux:component:notification_worker:instance:002"

redis-cli HSET "crux:component:notification_worker:instance:001" \
  "worker_id" "notification_worker" \
  "instance_id" "crux:component:notification_worker:instance:001" \
  "status" "online" \
  "thread_capacity" "15" \
  "current_thread_count" "0" \
  "hostname" "notification-node-01" \
  "port" "3003" \
  "started_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "last_heartbeat" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

redis-cli HSET "crux:component:notification_worker:instance:002" \
  "worker_id" "notification_worker" \
  "instance_id" "crux:component:notification_worker:instance:002" \
  "status" "online" \
  "thread_capacity" "15" \
  "current_thread_count" "3" \
  "hostname" "notification-node-02" \
  "port" "3003" \
  "started_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "last_heartbeat" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "✓ Worker instances created"

# 5. Sample WebSocket Event Payload (for testing)
redis-cli SET "sample:event:create_entity" '{
  "event_id": "evt_123456789",
  "event_type": "create_entity",
  "workflow_name": "create_entity",
  "timestamp": "2025-10-15T10:30:00Z",
  "source": "web_client",
  "client_id": "client_web_001",
  "metadata": {
    "entity": {
      "name": "Premium Wireless Headphones",
      "type": "product", 
      "attributes": {
        "category": "electronics",
        "price": 299.99,
        "currency": "USD",
        "description": "High-quality wireless headphones with noise cancellation",
        "sku": "HEADPHONES-2025-001",
        "brand": "TechCorp"
      }
    },
    "config": {
      "validate_strict": true,
      "send_notifications": true,
      "audit_log": true
    },
    "user_context": {
      "user_id": "user_456",
      "department": "product_management",
      "ip_address": "192.168.1.100"
    }
  }
}'

echo "✓ Sample event payload created"

# 6. Initialize Worker Queues (empty, ready for router service)
redis-cli DEL "worker_instance:crux:component:validation_worker:instance:001:queue"
redis-cli DEL "worker_instance:crux:component:validation_worker:instance:002:queue"
redis-cli DEL "worker_instance:crux:component:processing_worker:instance:001:queue"
redis-cli DEL "worker_instance:crux:component:notification_worker:instance:001:queue"
redis-cli DEL "worker_instance:crux:component:notification_worker:instance:002:queue"

echo "✓ Worker queues initialized"

# 7. Middleware Configuration
redis-cli SET "middleware:config:active" '{
  "version": "1.2.0",
  "last_updated": "2025-10-15T10:30:00Z",
  "middlewares": [
    {
      "id": "auth_middleware",
      "name": "Authentication Middleware",
      "enabled": true,
      "order": 1,
      "config": {
        "require_auth": true,
        "allowed_roles": ["admin", "user", "system"]
      }
    },
    {
      "id": "validation_middleware",
      "name": "Event Validation Middleware",
      "enabled": true,
      "order": 2,
      "config": {
        "validate_schema": true,
        "required_fields": ["event_type", "workflow_name", "metadata"]
      }
    },
    {
      "id": "logging_middleware",
      "name": "Event Logging Middleware", 
      "enabled": true,
      "order": 3,
      "config": {
        "log_level": "info",
        "include_payload": true
      }
    }
  ]
}'

echo "✓ Middleware configuration created"

echo ""
echo "🎉 Sample data setup complete!"
echo ""
echo "Summary:"
echo "- 1 Workflow definition (create_entity)"
echo "- 5 Worker instances across 3 worker types"
echo "- Worker assignments for the workflow"
echo "- Sample event payload for testing"
echo "- Empty worker queues ready for routing"
echo "- Middleware configuration"
echo ""
echo "Test your RouterService with:"
echo "curl -X POST http://localhost:3000/router/route-event \\""
echo "  -H \"Content-Type: application/json\" \\""
echo "  -d '{\"workflowName\": \"create_entity\", \"metadata\": {...}}'"
echo ""
echo "Monitor worker queues:"
echo "redis-cli LRANGE worker_instance:crux:component:validation_worker:instance:002:queue 0 -1"