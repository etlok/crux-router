import { Controller, Post, Body } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { AppGateway } from '../websocket/websocket.gateway';
import { RouterService } from 'src/router/router.service';

@Controller('events')
export class ApiController {
  constructor(private redisService: RedisService, private webSocketGateway : AppGateway, private routerService:RouterService) {}

  @Post()
  async handleIncoming(@Body() data: any) {
    console.log('Received REST API Event:', data);
    await this.redisService.publish( '',data);
    return { status: 'ok' };
  }


   @Post('/notify')
  async notifyClient (@Body() data: any) {
    console.log('Send REST API Event:', data);
this.webSocketGateway.broadcastEvent('working')
    return { status: 'ok' };
  }


  @Post('/websocket/event')
  async handleIncomingWebsocketEvent(@Body() data: any) {
    console.log('Received Event From Websocket:', data);
    this.routerService.routeEvent(data?.eventName, 'Some Extra details')
    
  }


   @Post('/api/event')
  async handleIncomingAPIEvent(@Body() data: any) {
    console.log('Received Event From API:', data);
    this.routerService.routeEvent(data?.eventName, 'Some Extra details')
    
  }

}
