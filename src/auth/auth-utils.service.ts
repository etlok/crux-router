import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthUtilsService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a test JWT token
   * @param userId User ID to include in the token
   * @param additionalClaims Additional claims to include
   * @returns JWT token string
   */
  generateTestToken(
    userId: string,
    additionalClaims: Record<string, any> = {},
  ): string {
    // Include some default entities for testing
    const defaultClaims = {
      entities: ['entity1', 'entity2'],  // Example entity IDs
      roles: ['user'],
      permissions: ['read', 'write']
    };

    return this.jwtService.sign(
      {
        sub: userId,
        ...defaultClaims,
        ...additionalClaims,
      },
      {
        secret: this.configService.get<string>('jwt.secret'),
        // expiresIn: this.configService.get<string>('jwt.expiresIn'),
        issuer: this.configService.get<string>('jwt.issuer'),
        audience: this.configService.get<string>('jwt.audience'),
      },
    );
  }
}
