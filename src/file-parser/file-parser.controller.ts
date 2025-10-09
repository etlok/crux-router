import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileParserService } from './file-parser.service';
import { EventDto } from './dto/event.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs/promises';

@Controller('file-parser')
export class FileParserController {
  constructor(private readonly fileParserService: FileParserService) {}

  @Post('parse')
  async parseContent(@Body() body: any): Promise<{
    success: boolean;
    events?: EventDto[];
    message?: string;
  }> {
    try {
      if (!body || typeof body !== 'object') {
        throw new BadRequestException('Invalid request body');
      }

      const content = JSON.stringify(body);
      const events =
        await this.fileParserService.parseAndValidateContent(content);
      console.log(events);
      return {
        success: true,
        events,
      };
    } catch (error) {
      console.log(error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('sample')
  async getSample(): Promise<{
    success: boolean;
    events?: EventDto[];
    message?: string;
  }> {
    try {
      const events = await this.fileParserService.loadSampleFile();
      return {
        success: true,
        events,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (
          file.mimetype !== 'application/json' &&
          !file.originalname.endsWith('.json')
        ) {
          return callback(
            new BadRequestException('Only JSON files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
    }),
  )
  async parseFile(@UploadedFile() file: Express.Multer.File): Promise<{
    success: boolean;
    events?: EventDto[];
    message?: string;
  }> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      try {
        await fs.mkdir('./uploads', { recursive: true });
      } catch (err) {
        // Ignore if directory already exists
      }

      const content = await fs.readFile(file.path, 'utf-8');
      const events =
        await this.fileParserService.parseAndValidateContent(content);

      try {
        await fs.unlink(file.path);
      } catch (err) {
        console.warn(
          `Could not delete temporary file ${file.path}: ${err.message}`,
        );
      }

      return {
        success: true,
        events,
      };
    } catch (error) {
      // Clean up on error too
      if (file?.path) {
        try {
          await fs.unlink(file.path).catch(() => {});
        } catch (err) {}
      }

      return {
        success: false,
        message: error.message,
      };
    }
  }
}
