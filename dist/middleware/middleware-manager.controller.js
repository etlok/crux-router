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
exports.MiddlewareManagerController = void 0;
const common_1 = require("@nestjs/common");
const path = require("path");
const fs = require("fs");
let MiddlewareManagerController = class MiddlewareManagerController {
    serveMiddlewareManager(res) {
        const filePath = path.join(process.cwd(), 'src', 'middleware', 'middleware-manager.html');
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
        else {
            return res.status(404).send('Middleware Manager UI not found');
        }
    }
};
exports.MiddlewareManagerController = MiddlewareManagerController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MiddlewareManagerController.prototype, "serveMiddlewareManager", null);
exports.MiddlewareManagerController = MiddlewareManagerController = __decorate([
    (0, common_1.Controller)('middleware-manager')
], MiddlewareManagerController);
//# sourceMappingURL=middleware-manager.controller.js.map