import { RedisService } from 'src/redis/redis.service';
import {
  Logger,
  UseGuards,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Updated ClientAuthService for JWT validation
@Injectable()
export class ClientAuthService {
  private readonly logger = new Logger(ClientAuthService.name);

  // Sample token for testing - generated once and stays constant
  private readonly SAMPLE_TEST_TOKEN: string;

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {
    // Generate a sample test token during service initialization
    this.SAMPLE_TEST_TOKEN = this.generateSampleTestToken();
  }

  /**
   * Validate a JWT token
   * @param token The JWT token to validate
   * @returns The decoded token payload if valid
   * @throws UnauthorizedException if token is invalid
   */
  async validateToken(token: string): Promise<any> {
    try {
      // Verify the JWT token
      const payload = this.jwtService.verify(token);

      // Optional: Check if the token has been revoked in Redis
      const isRevoked = await this.redisService.get(`revoked_token:${token}`);
      if (isRevoked) {
        this.logger.warn(`Attempt to use revoked token: ${token}`);
        throw new UnauthorizedException('Token has been revoked');
      }

      return payload;
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Generate a new JWT token
   * @param payload The payload to include in the token
   * @returns The generated token
   */
  generateToken(payload: any): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Revoke a token by adding it to the revoked tokens list in Redis
   * @param token The token to revoke
   * @param expiry Optional expiry time (defaults to token expiry)
   */
  async revokeToken(token: string, expiry?: number): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token);
      // If token has exp claim, use it for Redis expiry (with some buffer)
      const expiryTime =
        expiry ||
        (decoded && decoded['exp']
          ? decoded['exp'] - Math.floor(Date.now() / 1000) + 10
          : 3600);

      await this.redisService.set(`revoked_token:${token}`, 'true', expiryTime);
      this.logger.log(`Token revoked: ${token.substring(0, 10)}...`);
    } catch (error) {
      this.logger.error(`Failed to revoke token: ${error.message}`);
    }
  }

  /**
   * Generate a sample JWT token for testing purposes
   * This token has a very long expiration time (1 year)
   * @returns A sample JWT token string
   */
  private generateSampleTestToken(): string {
    const payload = {
      sub: 'test-user-123',
      name: 'Test User',
      role: 'tester',
      permissions: ['read', 'write'],
      // Let the JWT module handle the iat and exp claims
    };

    // Pass a custom expiration for this specific token
    return this.jwtService.sign(payload, { expiresIn: '365d' });
  }

  /**
   * Get the sample test token for client applications
   * @returns The sample test token string
   */
  getSampleTestToken(): string {
    return this.SAMPLE_TEST_TOKEN;
  }

  /**
   * Get sample test token with payload information (for documentation)
   * @returns Object containing token and its decoded payload
   */
  getSampleTestTokenWithInfo(): { token: string; payload: any } {
    const token = this.SAMPLE_TEST_TOKEN;
    const payload = this.jwtService.decode(token);
    return { token, payload };
  }
}
