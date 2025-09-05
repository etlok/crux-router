import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  enableKafka  : process.env.ENABLE_KAFKA,
    brokers: ['localhost:9092'],
      clientId: 'nestjs-pubsub',
}));