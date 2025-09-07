export declare class NoopKafkaService {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    sendMessage(topic: string, message: any): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
