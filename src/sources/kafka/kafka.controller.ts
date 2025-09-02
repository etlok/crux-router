import { Controller, Post, Body } from '@nestjs/common';
import { KafkaService } from './kafka.service';

@Controller('kafka')
export class KafkaController {
  constructor(private readonly kafkaService: KafkaService) {}

  @Post('produce')
  async produce(@Body() body: { eventName: string }) {
    await this.kafkaService.sendMessage(process.env.KAFKA_TOPIC || 'event-topic', JSON.stringify(body));
    return { status: 'sent', eventName: body.eventName };
  }
}