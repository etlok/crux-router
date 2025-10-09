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
exports.MiddlewareCodeController = void 0;
const common_1 = require("@nestjs/common");
const path = require("path");
const fs = require("fs");
let MiddlewareCodeController = class MiddlewareCodeController {
    async getMiddlewareCode(key, res) {
        try {
            if (!key.match(/^[a-z0-9-]+$/)) {
                return res.status(400).send('Invalid middleware key format');
            }
            const middlewarePath = path.join(process.cwd(), 'middleware', 'custom', `${key}.js`);
            if (fs.existsSync(middlewarePath)) {
                const code = fs.readFileSync(middlewarePath, 'utf8');
                return res.send(code);
            }
            const builtinPath = path.join(process.cwd(), 'src', 'middleware', 'middlewares', `${key}.middleware.ts`);
            if (fs.existsSync(builtinPath)) {
                const code = fs.readFileSync(builtinPath, 'utf8');
                return res.send(code);
            }
            return res.status(404).send(`Middleware '${key}' not found`);
        }
        catch (error) {
            console.error(`Error loading middleware code for ${key}:`, error);
            return res
                .status(500)
                .send(`Error loading middleware code: ${error.message}`);
        }
    }
};
exports.MiddlewareCodeController = MiddlewareCodeController;
__decorate([
    (0, common_1.Get)(':key'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MiddlewareCodeController.prototype, "getMiddlewareCode", null);
exports.MiddlewareCodeController = MiddlewareCodeController = __decorate([
    (0, common_1.Controller)('middleware-code')
], MiddlewareCodeController);
//# sourceMappingURL=middleware-code.controller.js.map