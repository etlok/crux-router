import { Body, Controller, Post } from '@nestjs/common';
import { RouterService } from './router.service';

@Controller('router')
export class RouterController {
  constructor(private readonly routerService: RouterService) {}

  @Post('route')
  async routeEvent(@Body() body: { event: string; payload: any }) {
    return this.routerService.routeEvent(body.event);
  }
}
