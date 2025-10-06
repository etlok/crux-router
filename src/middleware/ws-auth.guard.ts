import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Observable } from 'rxjs';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Get the socket from the context
    const client: Socket = context.switchToWs().getClient();
    
    // Check if the client is authenticated
    if (client.data.isAuthenticated && client.data.user) {
      return true;
    }
    
    throw new WsException('Unauthorized access');
  }
}
