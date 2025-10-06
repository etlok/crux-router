import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WsAuthMiddleware } from './ws-auth.middleware';


@Injectable()
export class WsAuthInterceptor implements NestInterceptor {
  constructor(private wsAuthMiddleware: WsAuthMiddleware) {}
  
  
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const client = context.switchToWs().getClient<Socket>();
    const data = context.switchToWs().getData();
    const event = context.getArgByIndex(2)?.event;
    
    if (event === 'authenticate') {
      return next.handle();
    }
    
    try {
    
      await this.wsAuthMiddleware.authenticate(client);
      
      // user info to the message data if authenticated
      if (client.data.user) {
        data._user = client.data.user;
      }
      
      return next.handle();
    } catch (err) {
      throw new WsException(`Authentication failed: ${err.message}`);
    }
  }
}
