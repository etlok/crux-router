import { EventDto } from './dto/event.dto';
export declare class FileParserService {
    private readonly logger;
    parseFile(filePath: string): Promise<EventDto[]>;
    parseAndValidateContent(content: string): Promise<EventDto[]>;
    loadSampleFile(): Promise<EventDto[]>;
}
