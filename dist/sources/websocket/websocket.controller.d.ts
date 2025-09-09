import { WSGateway } from './websocket.gateway';
import { ClientAuthService } from './client-auth.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';
declare class LoginDto {
    username: string;
    password: string;
}
declare class BroadcastDto {
    event: string;
    data: any;
    room?: string;
    clientId?: string;
}
declare class InitializeDto {
    auth: Record<string, any>;
    event: string;
    payload: {
        channels: string[];
    };
}
declare class ChannelBroadcastDto {
    event: string;
    channel_ids: string[];
    payload: Record<string, any>;
}
declare class TokenValidationDto {
    token: string;
}
export declare class WebSocketController {
    private readonly wsGateway;
    private readonly clientAuthService;
    private readonly jwtService;
    private readonly redisService;
    private readonly logger;
    constructor(wsGateway: WSGateway, clientAuthService: ClientAuthService, jwtService: JwtService, redisService: RedisService);
    generateToken(loginDto: LoginDto): Promise<{
        status: string;
        token: string;
        user: {
            id: string;
            username: string;
        };
    }>;
    validateToken(tokenDto: TokenValidationDto): Promise<{
        status: string;
        valid: boolean;
        payload: any;
        message?: undefined;
    } | {
        status: string;
        valid: boolean;
        message: any;
        payload?: undefined;
    }>;
    revokeToken(tokenDto: TokenValidationDto): Promise<{
        status: string;
        message: string;
    }>;
    broadcastMessage(broadcastDto: BroadcastDto): Promise<{
        status: string;
        message: string;
    }>;
    getConnections(): {
        status: string;
        connections: {
            total: number;
            authenticated: number;
            anonymous: number;
        };
    };
    generateTestToken(username?: string): {
        status: string;
        token: string;
        message: string;
    };
    private validateUserCredentials;
    private getUserId;
    initialize(initializeDto: InitializeDto): Promise<{
        status: string;
        message: string;
        channels: {
            channelId: string;
            status: string;
        }[];
        authenticated: boolean;
        sessionId: string;
    }>;
    channelBroadcast(broadcastDto: ChannelBroadcastDto): Promise<{
        status: string;
        message: string;
        channels: {
            channelId: string;
            status: string;
        }[];
        messageId: string;
    }>;
}
export {};
