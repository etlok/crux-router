"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileParserModule = void 0;
const common_1 = require("@nestjs/common");
const file_parser_service_1 = require("./file-parser.service");
const file_parser_controller_1 = require("./file-parser.controller");
let FileParserModule = class FileParserModule {
};
exports.FileParserModule = FileParserModule;
exports.FileParserModule = FileParserModule = __decorate([
    (0, common_1.Module)({
        providers: [file_parser_service_1.FileParserService],
        controllers: [file_parser_controller_1.FileParserController],
        exports: [file_parser_service_1.FileParserService],
    })
], FileParserModule);
//# sourceMappingURL=file-parser.module.js.map