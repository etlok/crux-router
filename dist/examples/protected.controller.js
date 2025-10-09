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
exports.ProtectedController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../middleware/auth.guard");
let ProtectedController = class ProtectedController {
    publicEndpoint() {
        return {
            message: 'This is a public endpoint that anyone can access',
        };
    }
    privateEndpoint() {
        return {
            message: 'This is a protected endpoint that requires authentication',
        };
    }
    userInfo(req) {
        return {
            message: 'This is your user information',
            user: req.user,
        };
    }
};
exports.ProtectedController = ProtectedController;
__decorate([
    (0, common_1.Get)('public'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProtectedController.prototype, "publicEndpoint", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('private'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProtectedController.prototype, "privateEndpoint", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('user-info'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProtectedController.prototype, "userInfo", null);
exports.ProtectedController = ProtectedController = __decorate([
    (0, common_1.Controller)('protected')
], ProtectedController);
//# sourceMappingURL=protected.controller.js.map