// src/sources/kafka/noop-kafka.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NoopKafkaService {
  private readonly logger = new Logger('NoopKafkaService');

  constructor() {
    this.logger.log('Kafka integration is disabled');
  }

  async onModuleInit() {
    // Do nothing
  }

  async sendMessage(topic: string, message: any) {
    this.logger.debug(`[NOOP] Would send message to topic ${topic}: ${JSON.stringify(message)}`);
    return Promise.resolve();
  }

  async onModuleDestroy() {
    // Do nothing
  }
}