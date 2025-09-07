import { KafkaService } from './kafka.service';
export declare class KafkaController {
    private readonly kafkaService;
    constructor(kafkaService: KafkaService);
    produce(body: {
        eventName: string;
    }): Promise<{
        status: string;
        eventName: string;
    }>;
}
