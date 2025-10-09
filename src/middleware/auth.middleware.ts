import {
  Injectable,
  NestMiddleware,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';

/**
 * Authentication middleware that validates JWT tokens
 * This middleware can be applied globally or to specific routes
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Middleware function to handle JWT authentication
   */
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = this.extractTokenFromHeader(req);

      // If no token is present, allow the request to continue
      // This allows public endpoints to work without authentication
      if (!token) {
        req['user'] = null; // Set user to null to indicate no authentication
        return next();
      }

      // Verify the JWT token
      try {
        const payload = await this.verifyToken(token);

        // Set the user object in the request for later use in controllers
        req['user'] = payload;
        req['isAuthenticated'] = true;
        req['token'] = token;
      } catch (error) {
        // Token validation failed, but we'll still allow the request to continue
        // Controllers can check req.isAuthenticated to enforce authentication when needed
        this.logger.warn(`Invalid token: ${error.message}`);
        req['user'] = null;
        req['isAuthenticated'] = false;
        req['authError'] = error.message;
      }

      next();
    } catch (error) {
      // For any unexpected errors, log and continue
      this.logger.error(`Authentication middleware error: ${error.message}`);
      next();
    }
  }

  /**
   * Extract JWT token from the request header
   */
  private extractTokenFromHeader(req: Request): string | null {
    // Check for token in Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7); // Remove "Bearer " prefix
    }

    // Check for token in the query parameters
    if (req.query && req.query.token) {
      return req.query.token as string;
    }

    // Check for token in request body
    if (req.body && req.body.auth && req.body.auth.token) {
      return req.body.auth.token;
    }

    // Check for token in cookies
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }

    return null;
  }

  /**
   * Verify JWT token and check if it's been revoked
   */
  private async verifyToken(token: string): Promise<any> {
    // First verify the token signature
    const payload = this.jwtService.verify(token);

    // Then check if the token has been revoked in Redis
    const isRevoked = await this.redisService.get(`revoked_token:${token}`);
    if (isRevoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return payload;
  }
}
