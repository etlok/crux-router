import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';
export declare class AuthMiddleware implements NestMiddleware {
    private readonly jwtService;
    private readonly redisService;
    private readonly logger;
    constructor(jwtService: JwtService, redisService: RedisService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private extractTokenFromHeader;
    private verifyToken;
}
