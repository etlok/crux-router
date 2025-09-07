import { Module, Global } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
          issuer: configService.get('jwt.issuer'),
          audience: configService.get('jwt.audience'),
        },
        verifyOptions: {
          issuer: configService.get('jwt.issuer'),
          audience: configService.get('jwt.audience'),
        }
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [NestJwtModule],
})
export class JwtModule {}
