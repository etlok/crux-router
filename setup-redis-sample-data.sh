#!/bin/bash

# Sample Redis Data Setup for Entity Creation Workflow
# Run this script on your Amazon Linux instance where Redis is running

echo "Setting up sample data for Entity Creation Workflow in Redis..."

# 1. Workflow Definition for create_entity
redis-cli HSET "workflow:create_entity" \
  "id" "create_entity" \
  "name" "Create Entity Workflow" \
  "description" "Workflow for creating new entities in the system" \
  "version" "1.0" \
  "steps" '[
    {
      "id": "validate_input",
      "name": "Validate Input Data", 
      "type": "validation",
      "config": {
        "required_fields": ["name", "type", "attributes"],
        "validation_rules": {
          "name": {"min_length": 1, "max_length": 100},
          "type": {"allowed_values": ["user", "product", "order", "category"]},
          "attributes": {"type": "object"}
        }
      },
      "next_step": "process_entity"
    },
    {
      "id": "process_entity", 
      "name": "Process Entity Creation",
      "type": "processing",
      "config": {
        "database_operation": "create",
        "table": "entities",
        "generate_id": true,
        "timestamps": true
      },
      "next_step": "notify_completion"
    },
    {
      "id": "notify_completion",
      "name": "Send Completion Notification", 
      "type": "notification",
      "config": {
        "notification_type": "websocket",
        "channels": ["entity_created", "admin_notifications"],
        "include_entity_data": true
      },
      "next_step": null
    }
  ]' \
  "created_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "updated_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "status" "active"

echo "✓ Workflow definition created"

# 2. Worker Definitions
# Worker 1: Validation Worker
redis-cli HSET "worker:validation_worker_001" \
  "id" "validation_worker_001" \
  "name" "Validation Worker 1" \
  "type" "validation" \
  "status" "active" \
  "thread_capacity" "10" \
  "current_thread_count" "0" \
  "max_concurrent_tasks" "10" \
  "supported_workflows" '["create_entity", "update_entity", "delete_entity"]' \
  "capabilities" '["input_validation", "schema_validation", "business_rules"]' \
  "health_check_url" "http://validation-worker-001:3001/health" \
  "last_heartbeat" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "created_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "performance_metrics" '{"avg_processing_time_ms": 150, "success_rate": 99.5, "error_rate": 0.5}'

# Worker 2: Processing Worker  
redis-cli HSET "worker:processing_worker_001" \
  "id" "processing_worker_001" \
  "name" "Processing Worker 1" \
  "type" "processing" \
  "status" "active" \
  "thread_capacity" "8" \
  "current_thread_count" "2" \
  "max_concurrent_tasks" "8" \
  "supported_workflows" '["create_entity", "update_entity"]' \
  "capabilities" '["database_operations", "data_transformation", "business_logic"]' \
  "health_check_url" "http://processing-worker-001:3002/health" \
  "last_heartbeat" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "created_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "performance_metrics" '{"avg_processing_time_ms": 500, "success_rate": 98.8, "error_rate": 1.2}'

# Worker 3: Notification Worker
redis-cli HSET "worker:notification_worker_001" \
  "id" "notification_worker_001" \
  "name" "Notification Worker 1" \
  "type" "notification" \
  "status" "active" \
  "thread_capacity" "15" \
  "current_thread_count" "1" \
  "max_concurrent_tasks" "15" \
  "supported_workflows" '["create_entity", "update_entity", "delete_entity", "system_notifications"]' \
  "capabilities" '["websocket_notifications", "email_notifications", "sms_notifications"]' \
  "health_check_url" "http://notification-worker-001:3003/health" \
  "last_heartbeat" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "created_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "performance_metrics" '{"avg_processing_time_ms": 200, "success_rate": 99.9, "error_rate": 0.1}'

echo "✓ Worker definitions created"

# 3. Worker Registry (for quick lookup)
redis-cli SADD "workers:active" "validation_worker_001" "processing_worker_001" "notification_worker_001"
redis-cli SADD "workers:by_type:validation" "validation_worker_001"
redis-cli SADD "workers:by_type:processing" "processing_worker_001"  
redis-cli SADD "workers:by_type:notification" "notification_worker_001"

# 4. Sample WebSocket Event Payload
redis-cli SET "sample:event:create_entity" '{
  "event_id": "evt_123456789",
  "event_type": "create_entity", 
  "workflow_id": "create_entity",
  "timestamp": "2025-10-15T10:30:00Z",
  "source": "web_client",
  "client_id": "client_web_001",
  "session_id": "sess_abc123def456",
  "payload": {
    "entity": {
      "name": "Sample Product",
      "type": "product", 
      "attributes": {
        "category": "electronics",
        "price": 299.99,
        "currency": "USD",
        "description": "High-quality electronic device",
        "sku": "PROD-2025-001",
        "tags": ["electronics", "gadget", "popular"],
        "specifications": {
          "weight": "1.2kg",
          "dimensions": "15x10x5cm",
          "warranty": "2 years"
        }
      }
    },
    "metadata": {
      "created_by": "user_456",
      "department": "product_management",
      "priority": "normal",
      "source_system": "admin_panel"
    }
  },
  "routing": {
    "target_workers": ["validation", "processing", "notification"],
    "processing_mode": "sequential",
    "timeout_seconds": 300,
    "retry_policy": {
      "max_attempts": 3,
      "backoff_strategy": "exponential"
    }
  }
}'

echo "✓ Sample event payload created"

# 5. Middleware Configuration for create_entity workflow
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
        "allowed_roles": ["admin", "user", "system"],
        "jwt_validation": true
      }
    },
    {
      "id": "rate_limit_middleware", 
      "name": "Rate Limiting Middleware",
      "enabled": true,
      "order": 2,
      "config": {
        "requests_per_minute": 100,
        "burst_limit": 20,
        "key_strategy": "client_id"
      }
    },
    {
      "id": "validation_middleware",
      "name": "Event Validation Middleware", 
      "enabled": true,
      "order": 3,
      "config": {
        "validate_schema": true,
        "validate_payload": true,
        "required_fields": ["event_type", "payload"]
      }
    },
    {
      "id": "logging_middleware",
      "name": "Event Logging Middleware",
      "enabled": true, 
      "order": 4,
      "config": {
        "log_level": "info",
        "include_payload": true,
        "log_destination": "redis_stream"
      }
    }
  ]
}'

echo "✓ Middleware configuration created"

# 6. Worker Load Balancing Configuration
redis-cli HSET "load_balancer:config" \
  "strategy" "round_robin" \
  "health_check_interval" "30" \
  "max_failures_before_removal" "3" \
  "worker_timeout_seconds" "60" \
  "enable_circuit_breaker" "true"

# 7. System Metrics and Monitoring
redis-cli HSET "system:metrics" \
  "total_workers" "3" \
  "active_workers" "3" \
  "total_thread_capacity" "33" \
  "current_thread_usage" "3" \
  "last_updated" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "✓ System configuration created"

# 8. Sample Queue for pending tasks
redis-cli LPUSH "queue:create_entity:pending" '{
  "task_id": "task_001",
  "event_id": "evt_123456789", 
  "workflow_id": "create_entity",
  "step_id": "validate_input",
  "worker_type": "validation",
  "priority": "normal",
  "created_at": "2025-10-15T10:30:00Z",
  "payload": {
    "entity": {
      "name": "Sample Product",
      "type": "product"
    }
  }
}'

echo "✓ Sample queue data created"

echo ""
echo "🎉 All sample data has been successfully added to Redis!"
echo ""
echo "Summary of what was created:"
echo "- 1 Workflow definition (create_entity)"
echo "- 3 Worker definitions (validation, processing, notification)"
echo "- Worker registry and load balancing config"
echo "- Sample WebSocket event payload"
echo "- Middleware configuration"
echo "- System metrics and monitoring data"
echo "- Sample task queue"
echo ""
echo "You can now test your workflow system with this data!"
echo ""
echo "Quick verification commands:"
echo "redis-cli HGETALL workflow:create_entity"
echo "redis-cli HGETALL worker:validation_worker_001"
echo "redis-cli GET sample:event:create_entity"
echo "redis-cli SMEMBERS workers:active"