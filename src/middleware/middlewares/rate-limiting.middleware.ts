import { Injectable, Logger } from '@nestjs/common';
import { BaseMiddleware, Middleware } from '../base.middleware';
import { Socket } from 'socket.io';

@Injectable()
@Middleware({ priority: 20 })
export class RateLimitingMiddleware extends BaseMiddleware {
  private readonly logger = new Logger(RateLimitingMiddleware.name);
  private readonly rateLimits = new Map<
    string,
    { count: number; resetTime: number }
  >();

  // Rate limit settings
  private readonly RATE_LIMIT = 50;
  private readonly RATE_WINDOW = 60000;

  async execute(
    context: { client: Socket; event: string; data: any },
    next: () => Promise<void>,
  ): Promise<void> {
    const { client, event } = context;

    // Skip rate limiting for certain events
    if (event === 'authenticate') {
      return next();
    }

    const clientId = client.id;
    const now = Date.now();

    let rateLimitData = this.rateLimits.get(clientId);

    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Initialize or reset rate limit
      rateLimitData = {
        count: 0,
        resetTime: now + this.RATE_WINDOW,
      };
      this.rateLimits.set(clientId, rateLimitData);
    }

    rateLimitData.count++;

    // Check if rate limit exceeded
    if (rateLimitData.count > this.RATE_LIMIT) {
      this.logger.warn(`Rate limit exceeded for client: ${clientId}`);

      client.emit('error', {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'You have exceeded the rate limit',
      });
    }

    // Continue to the next middleware
    await next();
  }
}
