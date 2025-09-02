# Crux Web Socket

A high-performance, distributed workflow engine with WebSocket, REST, and Kafka interfaces for event processing.

## Overview

Crux Web Socket is a robust event processing and workflow orchestration system that provides a unified interface for routing events through configured workflows. The system uses Redis for workflow state management and worker communication, making it highly scalable and fault-tolerant.

## Key Features

- **Multi-channel event ingestion**: Accept events via WebSocket, REST API, and Kafka
- **Dynamic workflow orchestration**: Configure workflows with multiple steps
- **Distributed worker system**: Scale workers independently based on workflow needs
- **Real-time communication**: WebSocket interfaces for immediate client notifications
- **Fault-tolerant design**: Redis-based persistence and message queue
- **Authentication support**: Client ID validation for secure communication

## System Components

### Event Sources

- **WebSocket Gateway**: Real-time bidirectional communication
- **REST API**: HTTP endpoints for event submission and status queries
- **Kafka Consumer**: Process events from Kafka topics

### Core Engine

- **Router Service**: Routes events to appropriate workflows
- **Redis Service**: Handles data persistence and pub/sub communication

### Worker System

- **Worker Manager**: Manages worker instances and thread allocation
- **Step Processors**: Execute individual workflow steps

## Data Model

### Workflow Instance

```json
{
  "definition": {
    "hooks": {
      "on_start": "",
      "on_complete": "",
      "on_failure": ""
    },
    "steps": [
      {
        "step_instance_id": "step_instance:abc111",
        "definition": {
          "class": "NotificationStep",
          "type": "send_notification",
          "steps": []
        }
      },
      {
        "step_instance_id": "step_instance:def222",
        "definition": {
          "class": "FinalizeOrderStep",
          "type": "finalize_order",
          "steps": []
        }
      }
    ]
  },
  "data": {
    "payload": {
      "orderId": "ORD-1234567",
      "customerId": "CUST-89101",
      "bookingTime": "2025-08-21T14:25:36Z"
    },
    "workflow_instance_id": "workflow_instance:123456",
    "request_id": "req-xyz-789"
  },
  "metadata": {
    "start_time": "2025-08-21T14:25:36Z",
    "end_time": "",
    "status": "pending",
    "current_step": "step_instance:abc111"
  }
}