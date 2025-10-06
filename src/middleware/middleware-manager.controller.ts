import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('middleware-manager')
export class MiddlewareManagerController {
  @Get()
  serveMiddlewareManager(@Res() res: Response) {
    const filePath = path.join(process.cwd(), 'src', 'middleware', 'middleware-manager.html');
    
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    } else {
      return res.status(404).send('Middleware Manager UI not found');
    }
  }
}
