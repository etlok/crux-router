import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, Producer, logLevel, KafkaMessage } from 'kafkajs';
import { RedisService } from 'src/redis/redis.service';
import { RouterService } from 'src/router/router.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private readonly logger = new Logger(KafkaService.name);
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private messageRetryCount = new Map<string, number>();

  constructor(
    private redisService: RedisService,
    private routerService: RouterService,
        private readonly configService: ConfigService,

  ) {
    this.kafka = new Kafka({
      clientId: 'ws-router-client',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      logLevel: logLevel.INFO,
      ...(process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD
        ? {
            sasl: {
              mechanism: 'plain',
              username: process.env.KAFKA_USERNAME,
              password: process.env.KAFKA_PASSWORD,
            },
            ssl: true,
          }
        : {}),
    });

    this.consumer = this.kafka.consumer({ groupId: 'ws-router-group' });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.connectWithRetry();
    await this.subscribeAndRun();
  }

  private async connectWithRetry(retries = 0) {
    try {
      await this.consumer.connect();
      await this.producer.connect();
      this.logger.log('Kafka consumer and producer connected');
    } catch (err) {
      const delay = Math.min(1000 * 2 ** retries, 30000);
      this.logger.error(`Kafka connection failed: ${err.message}. Retrying in ${delay}ms`);
      setTimeout(() => this.connectWithRetry(retries + 1), delay);
    }
  }



    // Add a method to handle failed messages
  private async handleFailedMessage(message: KafkaMessage, error: Error) {
    const messageId = message.key?.toString() || 
                     `${message.timestamp}-${message.offset}`;
                     
    // Check if we've already retried this message too many times
    const retryCount = this.messageRetryCount.get(messageId) || 0;
    
    if (retryCount >= this.MAX_RETRY_ATTEMPTS) {
      // We've retried enough - send to dead letter queue
      try {
        await this.producer.send({
          topic: this.configService.get('app.kafka.deadLetterTopic') || 'dead-letter-queue',
          messages: [{
            key: message.key,
            value: JSON.stringify({
              originalMessage: message.value?.toString(),
              error: error.message,
              processingAttempts: retryCount + 1,
              timestamp: new Date().toISOString()
            })
          }]
    });
        
        this.logger.warn(
          `Message sent to dead letter queue after ${retryCount + 1} attempts: ${messageId}`,
          KafkaService.name
        );
        
        // Clear from retry tracking
        this.messageRetryCount.delete(messageId);
      } catch (dlqError) {
        this.logger.error(
          `Failed to send message to dead letter queue: ${dlqError.message}`,
          dlqError.stack,
          KafkaService.name
        );
      }
    } else {
      // Increment retry count for next time
      this.messageRetryCount.set(messageId, retryCount + 1);
      this.logger.warn(
        `Will retry processing message ${messageId}. Attempt ${retryCount + 1} of ${this.MAX_RETRY_ATTEMPTS}`,
        KafkaService.name
      );
    }
  }



 async subscribeAndRun() {

  // First, subscribe to the topic(s)
  await this.consumer.subscribe({ 
    topics:['event-topic'],
    fromBeginning: false 
  });
  
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if(!message.value) return;

          const parsedMessage = JSON.parse(message.value.toString());
          this.logger.log(`Received message from Kafka: ${JSON.stringify(parsedMessage)}`, KafkaService.name);
          
          const { event, payload } = parsedMessage;
          if (!event) {
            throw new Error('Missing event field in Kafka message');
          }
          
          // Route the event to the router service
          await this.routerService.routeEvent(event, payload);
          
          // On success, remove from retry tracking if it exists
          const messageId = message.key?.toString() || `${message.timestamp}-${message.offset}`;
          if (this.messageRetryCount.has(messageId)) {
            this.messageRetryCount.delete(messageId);
          }
        } catch (error) {
          this.logger.error(`Error processing Kafka message: ${error.message}`, error.stack, KafkaService.name);
          await this.handleFailedMessage(message, error);
        }
      },
    });
  }

  async sendMessage(topic: string, message: any) {
    this.logger.log(`Sending message to topic ${topic}: ${JSON.stringify(message)}`);
    await this.producer.send({
      topic,
      messages: [{ value: typeof message === 'string' ? message : JSON.stringify(message) }],
    });
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Kafka consumer and producer');
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}
