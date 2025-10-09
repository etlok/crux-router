import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check if the user was set by the AuthMiddleware
    if (request.isAuthenticated && request.user) {
      return true;
    }

    throw new UnauthorizedException('Access denied. Authentication required.');
  }
}
