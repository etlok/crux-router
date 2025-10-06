import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('middleware-code')
export class MiddlewareCodeController {
  @Get(':key')
  async getMiddlewareCode(@Param('key') key: string, @Res() res: Response) {
    try {
      // Validate key to prevent directory traversal attacks
      if (!key.match(/^[a-z0-9-]+$/)) {
        return res.status(400).send('Invalid middleware key format');
      }

      // Try to find the middleware file
      const middlewarePath = path.join(process.cwd(), 'middleware', 'custom', `${key}.js`);
      
      if (fs.existsSync(middlewarePath)) {
        const code = fs.readFileSync(middlewarePath, 'utf8');
        return res.send(code);
      }
      
      // Try the built-in middleware path as fallback
      const builtinPath = path.join(process.cwd(), 'src', 'middleware', 'middlewares', `${key}.middleware.ts`);
      
      if (fs.existsSync(builtinPath)) {
        const code = fs.readFileSync(builtinPath, 'utf8');
        return res.send(code);
      }
      
      return res.status(404).send(`Middleware '${key}' not found`);
    } catch (error) {
      console.error(`Error loading middleware code for ${key}:`, error);
      return res.status(500).send(`Error loading middleware code: ${error.message}`);
    }
  }
}
