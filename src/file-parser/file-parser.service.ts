import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EventDto } from './dto/event.dto';
import * as path from 'path';

@Injectable()
export class FileParserService {
  private readonly logger = new Logger(FileParserService.name);

  /**
   * Parse and validate a JSON file against the expected event structure
   * @param filePath Path to the JSON file
   */
  async parseFile(filePath: string): Promise<EventDto[]> {
    try {
      // Read the file content
      const content = await readFile(filePath, 'utf-8');
      return this.parseAndValidateContent(content);
    } catch (error) {
      this.logger.error(`Error parsing file ${filePath}: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to parse file: ${error.message}`);
    }
  }

  /**
   * Parse and validate JSON string against the expected event structure
   * @param content JSON content as string
   */
  async parseAndValidateContent(content: string): Promise<EventDto[]> {
    try {
      // Parse JSON
      const jsonData = JSON.parse(content);

      // Validate array format
      if (!Array.isArray(jsonData)) {
        throw new BadRequestException(
          'JSON content must be an array of events',
        );
      }

      // Transform and validate each event
      const events = jsonData.map((event) => {
        const eventObj = plainToClass(EventDto, event);
        const errors = validateSync(eventObj, {
          whitelist: true,
          forbidNonWhitelisted: true,
          forbidUnknownValues: true,
        });

        if (errors.length > 0) {
          const messages = errors.map((error) => {
            const constraints = error.constraints
              ? Object.values(error.constraints)
              : ['Invalid value'];
            return `${error.property}: ${constraints.join(', ')}`;
          });

          throw new BadRequestException(
            `Validation failed: ${messages.join('; ')}`,
          );
        }

        return eventObj;
      });

      return events;
    } catch (error) {
      this.logger.error(`Error validating content: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to validate content: ${error.message}`,
      );
    }
  }

  /**
   * Load a sample JSON file for testing
   */
  async loadSampleFile(): Promise<EventDto[]> {
    const samplePath = path.join(__dirname, '../../sample-event.json');
    return this.parseFile(samplePath);
  }
}
