import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';
import { Socket } from 'socket.io';
export declare class WsAuthMiddleware {
    private readonly jwtService;
    private readonly redisService;
    constructor(jwtService: JwtService, redisService: RedisService);
    authenticate(client: Socket): Promise<any>;
    private extractToken;
    private verifyToken;
}
