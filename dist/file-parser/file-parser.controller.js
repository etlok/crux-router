"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileParserController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const file_parser_service_1 = require("./file-parser.service");
const multer_1 = require("multer");
const path_1 = require("path");
const fs = require("fs/promises");
let FileParserController = class FileParserController {
    fileParserService;
    constructor(fileParserService) {
        this.fileParserService = fileParserService;
    }
    async parseContent(body) {
        try {
            if (!body || typeof body !== 'object') {
                throw new common_1.BadRequestException('Invalid request body');
            }
            const content = JSON.stringify(body);
            const events = await this.fileParserService.parseAndValidateContent(content);
            console.log(events);
            return {
                success: true,
                events,
            };
        }
        catch (error) {
            console.log(error.message);
            return {
                success: false,
                message: error.message,
            };
        }
    }
    async getSample() {
        try {
            const events = await this.fileParserService.loadSampleFile();
            return {
                success: true,
                events,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
    async parseFile(file) {
        try {
            if (!file) {
                throw new common_1.BadRequestException('No file uploaded');
            }
            try {
                await fs.mkdir('./uploads', { recursive: true });
            }
            catch (err) {
            }
            const content = await fs.readFile(file.path, 'utf-8');
            const events = await this.fileParserService.parseAndValidateContent(content);
            try {
                await fs.unlink(file.path);
            }
            catch (err) {
                console.warn(`Could not delete temporary file ${file.path}: ${err.message}`);
            }
            return {
                success: true,
                events,
            };
        }
        catch (error) {
            if (file?.path) {
                try {
                    await fs.unlink(file.path).catch(() => { });
                }
                catch (err) { }
            }
            return {
                success: false,
                message: error.message,
            };
        }
    }
};
exports.FileParserController = FileParserController;
__decorate([
    (0, common_1.Post)('parse'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FileParserController.prototype, "parseContent", null);
__decorate([
    (0, common_1.Get)('sample'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FileParserController.prototype, "getSample", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (file.mimetype !== 'application/json' &&
                !file.originalname.endsWith('.json')) {
                return callback(new common_1.BadRequestException('Only JSON files are allowed'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 1024 * 1024 * 5,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FileParserController.prototype, "parseFile", null);
exports.FileParserController = FileParserController = __decorate([
    (0, common_1.Controller)('file-parser'),
    __metadata("design:paramtypes", [file_parser_service_1.FileParserService])
], FileParserController);
//# sourceMappingURL=file-parser.controller.js.map