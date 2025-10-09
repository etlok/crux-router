import { Injectable, Logger } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

/**
 * Service responsible for emitting worker logs to WebSocket clients
 */
@Injectable()
export class WorkerLogEmitterService {
  @WebSocketServer() private server: Server;
  private readonly logger = new Logger(WorkerLogEmitterService.name);

  // This method should be called by the logging system when worker logs are generated
  emitWorkerLog(logMessage: string): void {
    try {
      if (!this.server) {
        return;
      }

      // Check for worker selection logs
      if (
        logMessage.includes('Selected worker instance:') &&
        logMessage.includes('with utilization:')
      ) {
        // Example: Selected worker instance: crux:instance:02-crux-generic-worker-926a8957 (02-crux-generic-worker) with utilization: 1.2%
        const workerMatch = logMessage.match(
          /Selected worker instance: ([^ ]+) \(([^)]+)\) with utilization: ([0-9.]+)%/,
        );

        if (workerMatch) {
          const workerId = workerMatch[1];
          const workerName = workerMatch[2];
          const utilization = workerMatch[3];

          this.server.emit('worker_log', {
            type: 'worker_selected',
            message: logMessage,
            workerId,
            workerName,
            utilization,
          });

          this.logger.debug(
            `Emitted worker selection event: ${workerName} (${utilization}%)`,
          );
        }
      }

      // Check for step instance added to queue logs
      else if (
        logMessage.includes('Added step step_instance:') &&
        logMessage.includes('to queue worker_instance:')
      ) {
        // Example: Added step step_instance:5b576fb0-33d8-456b-88e3-6582bebe3e31 to queue worker_instance:crux:instance:02-crux-generic-worker-926a8957:queue
        const stepMatch = logMessage.match(
          /Added step (step_instance:[a-z0-9-]+) to queue (worker_instance:[^:]+:[^:]+:[^:]+)/,
        );

        if (stepMatch) {
          const stepInstanceId = stepMatch[1];
          const workerInstanceId = stepMatch[2];

          this.server.emit('worker_log', {
            type: 'step_added',
            message: logMessage,
            stepInstanceId,
            workerInstanceId,
          });

          this.logger.debug(
            `Emitted step added to queue event: ${stepInstanceId}`,
          );
        }
      }

      // Generic workflow logs - catch anything related to workflow/worker/step processing
      else if (
        logMessage.includes('step_instance:') ||
        logMessage.includes('worker_instance:') ||
        logMessage.includes('workflow:')
      ) {
        this.server.emit('worker_log', {
          type: 'workflow_log',
          message: logMessage,
        });
      }
    } catch (error) {
      this.logger.error(`Error emitting worker log: ${error.message}`);
    }
  }

  /**
   * Set the WebSocket server instance
   */
  setServer(server: Server): void {
    this.server = server;
  }
}
