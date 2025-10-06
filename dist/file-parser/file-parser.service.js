"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FileParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileParserService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("fs/promises");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const event_dto_1 = require("./dto/event.dto");
const path = require("path");
let FileParserService = FileParserService_1 = class FileParserService {
    logger = new common_1.Logger(FileParserService_1.name);
    async parseFile(filePath) {
        try {
            const content = await (0, promises_1.readFile)(filePath, 'utf-8');
            return this.parseAndValidateContent(content);
        }
        catch (error) {
            this.logger.error(`Error parsing file ${filePath}: ${error.message}`);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to parse file: ${error.message}`);
        }
    }
    async parseAndValidateContent(content) {
        try {
            const jsonData = JSON.parse(content);
            if (!Array.isArray(jsonData)) {
                throw new common_1.BadRequestException('JSON content must be an array of events');
            }
            const events = jsonData.map(event => {
                const eventObj = (0, class_transformer_1.plainToClass)(event_dto_1.EventDto, event);
                const errors = (0, class_validator_1.validateSync)(eventObj, {
                    whitelist: true,
                    forbidNonWhitelisted: true,
                    forbidUnknownValues: true
                });
                if (errors.length > 0) {
                    const messages = errors.map(error => {
                        const constraints = error.constraints ? Object.values(error.constraints) : ['Invalid value'];
                        return `${error.property}: ${constraints.join(', ')}`;
                    });
                    throw new common_1.BadRequestException(`Validation failed: ${messages.join('; ')}`);
                }
                return eventObj;
            });
            return events;
        }
        catch (error) {
            this.logger.error(`Error validating content: ${error.message}`);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to validate content: ${error.message}`);
        }
    }
    async loadSampleFile() {
        const samplePath = path.join(__dirname, '../../sample-event.json');
        return this.parseFile(samplePath);
    }
};
exports.FileParserService = FileParserService;
exports.FileParserService = FileParserService = FileParserService_1 = __decorate([
    (0, common_1.Injectable)()
], FileParserService);
//# sourceMappingURL=file-parser.service.js.map