import { RedisService } from 'src/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
export declare class ClientAuthService {
    private readonly redisService;
    private readonly jwtService;
    private readonly logger;
    private readonly SAMPLE_TEST_TOKEN;
    constructor(redisService: RedisService, jwtService: JwtService);
    validateToken(token: string): Promise<any>;
    generateToken(payload: any): string;
    revokeToken(token: string, expiry?: number): Promise<void>;
    private generateSampleTestToken;
    getSampleTestToken(): string;
    getSampleTestTokenWithInfo(): {
        token: string;
        payload: any;
    };
}
