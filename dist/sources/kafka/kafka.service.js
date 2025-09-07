"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KafkaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kafkajs_1 = require("kafkajs");
const redis_service_1 = require("../../redis/redis.service");
const router_service_1 = require("../../router/router.service");
let KafkaService = KafkaService_1 = class KafkaService {
    redisService;
    routerService;
    configService;
    kafka;
    consumer;
    producer;
    logger = new common_1.Logger(KafkaService_1.name);
    MAX_RETRY_ATTEMPTS = 3;
    messageRetryCount = new Map();
    constructor(redisService, routerService, configService) {
        this.redisService = redisService;
        this.routerService = routerService;
        this.configService = configService;
        this.kafka = new kafkajs_1.Kafka({
            clientId: 'ws-router-client',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
            logLevel: kafkajs_1.logLevel.INFO,
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
    async connectWithRetry(retries = 0) {
        try {
            await this.consumer.connect();
            await this.producer.connect();
            this.logger.log('Kafka consumer and producer connected');
        }
        catch (err) {
            const delay = Math.min(1000 * 2 ** retries, 30000);
            this.logger.error(`Kafka connection failed: ${err.message}. Retrying in ${delay}ms`);
            setTimeout(() => this.connectWithRetry(retries + 1), delay);
        }
    }
    async handleFailedMessage(message, error) {
        const messageId = message.key?.toString() ||
            `${message.timestamp}-${message.offset}`;
        const retryCount = this.messageRetryCount.get(messageId) || 0;
        if (retryCount >= this.MAX_RETRY_ATTEMPTS) {
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
                this.logger.warn(`Message sent to dead letter queue after ${retryCount + 1} attempts: ${messageId}`, KafkaService_1.name);
                this.messageRetryCount.delete(messageId);
            }
            catch (dlqError) {
                this.logger.error(`Failed to send message to dead letter queue: ${dlqError.message}`, dlqError.stack, KafkaService_1.name);
            }
        }
        else {
            this.messageRetryCount.set(messageId, retryCount + 1);
            this.logger.warn(`Will retry processing message ${messageId}. Attempt ${retryCount + 1} of ${this.MAX_RETRY_ATTEMPTS}`, KafkaService_1.name);
        }
    }
    async subscribeAndRun() {
        await this.consumer.subscribe({
            topics: ['event-topic'],
            fromBeginning: false
        });
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    if (!message.value)
                        return;
                    const parsedMessage = JSON.parse(message.value.toString());
                    this.logger.log(`Received message from Kafka: ${JSON.stringify(parsedMessage)}`, KafkaService_1.name);
                    const { event, payload } = parsedMessage;
                    if (!event) {
                        throw new Error('Missing event field in Kafka message');
                    }
                    await this.routerService.routeEvent(event, payload);
                    const messageId = message.key?.toString() || `${message.timestamp}-${message.offset}`;
                    if (this.messageRetryCount.has(messageId)) {
                        this.messageRetryCount.delete(messageId);
                    }
                }
                catch (error) {
                    this.logger.error(`Error processing Kafka message: ${error.message}`, error.stack, KafkaService_1.name);
                    await this.handleFailedMessage(message, error);
                }
            },
        });
    }
    async sendMessage(topic, message) {
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
};
exports.KafkaService = KafkaService;
exports.KafkaService = KafkaService = KafkaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        router_service_1.RouterService,
        config_1.ConfigService])
], KafkaService);
//# sourceMappingURL=kafka.service.js.map