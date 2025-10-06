import { Module } from '@nestjs/common';
import { FileParserService } from './file-parser.service';
import { FileParserController } from './file-parser.controller';

@Module({
  providers: [FileParserService],
  controllers: [FileParserController],
  exports: [FileParserService],
})
export class FileParserModule {}
