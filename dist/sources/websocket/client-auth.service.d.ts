import { RedisService } from 'src/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
export declare class ClientAuthService {
    private readonly redisService;
    private readonly jwtService;
    private readonly logger;
    constructor(redisService: RedisService, jwtService: JwtService);
    validateToken(token: string): Promise<any>;
    generateToken(payload: any): string;
    revokeToken(token: string, expiry?: number): Promise<void>;
}
