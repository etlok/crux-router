#!/bin/bash

# Test Script for RouterService with Sample Data
# This demonstrates how your routeEvent function will interact with the Redis data

echo "=== RouterService Test Scenario ==="
echo ""

# 1. Show workflow definition that will be fetched
echo "1. Workflow Definition (workflow:create_entity):"
redis-cli --raw GET workflow:create_entity | jq .
echo ""

# 2. Show worker assignments (hash method - primary)
echo "2. Worker Assignments (workflow:create_entity:workers):"
redis-cli HGETALL workflow:create_entity:workers
echo ""

# 3. Show available worker instances for each worker type
echo "3. Available Worker Instances:"
echo ""

echo "Validation Workers:"
for instance in $(redis-cli SMEMBERS crux:component:validation_worker:instances); do
  echo "  Instance: $instance"
  redis-cli HGETALL "$instance" | grep -E "(status|thread_capacity|current_thread_count)"
  utilization=$(redis-cli HGET "$instance" current_thread_count)
  capacity=$(redis-cli HGET "$instance" thread_capacity)
  if [ -n "$utilization" ] && [ -n "$capacity" ] && [ "$capacity" -ne 0 ]; then
    echo "  Utilization: $(($utilization * 100 / $capacity))%"
  fi
  echo ""
done

echo "Processing Workers:"
for instance in $(redis-cli SMEMBERS crux:component:processing_worker:instances); do
  echo "  Instance: $instance"
  redis-cli HGETALL "$instance" | grep -E "(status|thread_capacity|current_thread_count)"
  utilization=$(redis-cli HGET "$instance" current_thread_count)
  capacity=$(redis-cli HGET "$instance" thread_capacity)
  if [ -n "$utilization" ] && [ -n "$capacity" ] && [ "$capacity" -ne 0 ]; then
    echo "  Utilization: $(($utilization * 100 / $capacity))%"
  fi
  echo ""
done

echo "Notification Workers:"
for instance in $(redis-cli SMEMBERS crux:component:notification_worker:instances); do
  echo "  Instance: $instance"
  redis-cli HGETALL "$instance" | grep -E "(status|thread_capacity|current_thread_count)"
  utilization=$(redis-cli HGET "$instance" current_thread_count)
  capacity=$(redis-cli HGET "$instance" thread_capacity)
  if [ -n "$utilization" ] && [ -n "$capacity" ] && [ "$capacity" -ne 0 ]; then
    echo "  Utilization: $(($utilization * 100 / $capacity))%"
  fi
  echo ""
done

# 4. Show sample event payload
echo "4. Sample Event Payload:"
redis-cli --raw GET sample:event:create_entity | jq .
echo ""

# 5. Show current state of worker queues (should be empty initially)
echo "5. Current Worker Queue Status:"
echo ""

echo "Validation Worker Queues:"
for instance in $(redis-cli SMEMBERS crux:component:validation_worker:instances); do
  queue_key="worker_instance:${instance}:queue"
  queue_length=$(redis-cli LLEN "$queue_key")
  echo "  $queue_key: $queue_length items"
done

echo ""
echo "Processing Worker Queues:"
for instance in $(redis-cli SMEMBERS crux:component:processing_worker:instances); do
  queue_key="worker_instance:${instance}:queue"
  queue_length=$(redis-cli LLEN "$queue_key")
  echo "  $queue_key: $queue_length items"
done

echo ""
echo "Notification Worker Queues:"
for instance in $(redis-cli SMEMBERS crux:component:notification_worker:instances); do
  queue_key="worker_instance:${instance}:queue"
  queue_length=$(redis-cli LLEN "$queue_key")
  echo "  $queue_key: $queue_length items"
done

echo ""
echo "=== Expected RouterService Behavior ==="
echo ""
echo "When you call routeEvent('create_entity', metadata):"
echo ""
echo "1. Will fetch workflow definition from 'workflow:create_entity'"
echo "2. Will find workers from 'workflow:create_entity:workers' hash"
echo "3. Will get instances for each worker from 'crux:component:{workerId}:instances'"
echo "4. Will select lowest utilization instances:"
echo "   - validation_worker: instance:002 (0% utilization)"
echo "   - processing_worker: instance:001 (12.5% utilization)" 
echo "   - notification_worker: instance:001 (0% utilization)"
echo "5. Will create step instances and add to respective worker queues"
echo "6. Will increment current_thread_count for selected workers"
echo ""
echo "=== Test Your RouterService ==="
echo ""
echo "curl -X POST http://localhost:3000/api/route-event \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"workflowName\": \"create_entity\","
echo "    \"metadata\": {"
echo "      \"entity\": {"
echo "        \"name\": \"Test Product\","
echo "        \"type\": \"product\","
echo "        \"attributes\": {\"category\": \"test\"}"
echo "      },"
echo "      \"config\": {\"validate_strict\": true}"
echo "    }"
echo "  }'"