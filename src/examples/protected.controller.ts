import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../middleware/auth.guard';

/**
 * Example controller for protected routes
 */
@Controller('protected')
export class ProtectedController {
  /**
   * Public route - no authentication required
   */
  @Get('public')
  publicEndpoint() {
    return {
      message: 'This is a public endpoint that anyone can access',
    };
  }

  /**
   * Protected route - requires authentication
   */
  @UseGuards(AuthGuard)
  @Get('private')
  privateEndpoint() {
    return {
      message: 'This is a protected endpoint that requires authentication',
    };
  }

  /**
   * Protected route with user info
   */
  @UseGuards(AuthGuard)
  @Get('user-info')
  userInfo(@Req() req) {
    return {
      message: 'This is your user information',
      user: req.user,
    };
  }
}
