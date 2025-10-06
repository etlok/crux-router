import { FileParserService } from './file-parser.service';
import { EventDto } from './dto/event.dto';
export declare class FileParserController {
    private readonly fileParserService;
    constructor(fileParserService: FileParserService);
    parseContent(body: any): Promise<{
        success: boolean;
        events?: EventDto[];
        message?: string;
    }>;
    getSample(): Promise<{
        success: boolean;
        events?: EventDto[];
        message?: string;
    }>;
    parseFile(file: Express.Multer.File): Promise<{
        success: boolean;
        events?: EventDto[];
        message?: string;
    }>;
}
