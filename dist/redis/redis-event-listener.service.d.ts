import { OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';
import { WSGateway } from 'src/sources/websocket/websocket.gateway';
export declare class RedisEventListenerService implements OnModuleInit {
    private readonly redisService;
    private readonly socketGateway;
    constructor(redisService: RedisService, socketGateway: WSGateway);
    onModuleInit(): Promise<void>;
}
