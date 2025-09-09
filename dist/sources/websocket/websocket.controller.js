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
var WebSocketController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketController = void 0;
const common_1 = require("@nestjs/common");
const websocket_gateway_1 = require("./websocket.gateway");
const client_auth_service_1 = require("./client-auth.service");
const jwt_1 = require("@nestjs/jwt");
const redis_service_1 = require("../../redis/redis.service");
const uuid_1 = require("uuid");
class LoginDto {
    username;
    password;
}
class BroadcastDto {
    event;
    data;
    room;
    clientId;
}
class InitializeDto {
    auth;
    event;
    payload;
}
class ChannelBroadcastDto {
    event;
    channel_ids;
    payload;
}
class TokenValidationDto {
    token;
}
let WebSocketController = WebSocketController_1 = class WebSocketController {
    wsGateway;
    clientAuthService;
    jwtService;
    redisService;
    logger = new common_1.Logger(WebSocketController_1.name);
    constructor(wsGateway, clientAuthService, jwtService, redisService) {
        this.wsGateway = wsGateway;
        this.clientAuthService = clientAuthService;
        this.jwtService = jwtService;
        this.redisService = redisService;
    }
    async generateToken(loginDto) {
        try {
            if (!loginDto.username || !loginDto.password) {
                throw new common_1.BadRequestException('Username and password are required');
            }
            const isValidUser = await this.validateUserCredentials(loginDto.username, loginDto.password);
            if (!isValidUser) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const userId = await this.getUserId(loginDto.username);
            const token = this.jwtService.sign({
                sub: userId,
                username: loginDto.username,
                roles: ['user'],
            });
            await this.redisService.set(`user_token:${userId}:${token.substring(0, 20)}`, JSON.stringify({
                created: new Date().toISOString(),
                username: loginDto.username,
                active: true
            }), 60 * 60 * 24 * 7);
            return {
                status: 'success',
                token,
                user: {
                    id: userId,
                    username: loginDto.username
                }
            };
        }
        catch (error) {
            this.logger.error(`Token generation failed: ${error.message}`);
            throw error;
        }
    }
    async validateToken(tokenDto) {
        try {
            if (!tokenDto.token) {
                throw new common_1.BadRequestException('Token is required');
            }
            const payload = await this.clientAuthService.validateToken(tokenDto.token);
            return {
                status: 'success',
                valid: true,
                payload
            };
        }
        catch (error) {
            this.logger.warn(`Token validation failed: ${error.message}`);
            return {
                status: 'error',
                valid: false,
                message: error.message
            };
        }
    }
    async revokeToken(tokenDto) {
        try {
            if (!tokenDto.token) {
                throw new common_1.BadRequestException('Token is required');
            }
            await this.clientAuthService.revokeToken(tokenDto.token);
            return {
                status: 'success',
                message: 'Token revoked successfully'
            };
        }
        catch (error) {
            this.logger.error(`Token revocation failed: ${error.message}`);
            throw error;
        }
    }
    async broadcastMessage(broadcastDto) {
        try {
            if (!broadcastDto.event || !broadcastDto.data) {
                throw new common_1.BadRequestException('Event and data are required');
            }
            const eventData = {
                ...broadcastDto.data,
                _meta: {
                    source: 'api',
                    timestamp: new Date().toISOString()
                }
            };
            if (broadcastDto.room) {
                this.logger.log(`Broadcasting to room ${broadcastDto.room}: ${JSON.stringify(eventData)}`);
                this.wsGateway.server.to(broadcastDto.room).emit('outgoing_event', {
                    event: broadcastDto.event,
                    data: eventData
                });
            }
            else if (broadcastDto.clientId) {
                this.logger.log(`Broadcasting to client ${broadcastDto.clientId}: ${JSON.stringify(eventData)}`);
                this.wsGateway.server.to(broadcastDto.clientId).emit('outgoing_event', {
                    event: broadcastDto.event,
                    data: eventData
                });
            }
            else {
                this.logger.log(`Broadcasting to all clients: ${JSON.stringify(eventData)}`);
                this.wsGateway.broadcastEvent({
                    event: broadcastDto.event,
                    data: eventData
                });
            }
            return {
                status: 'success',
                message: 'Message broadcasted successfully'
            };
        }
        catch (error) {
            this.logger.error(`Broadcasting failed: ${error.message}`);
            throw error;
        }
    }
    getConnections() {
        const totalConnections = this.wsGateway.getConnectedClientsCount();
        const authenticatedConnections = this.wsGateway.getAuthenticatedClientsCount();
        return {
            status: 'success',
            connections: {
                total: totalConnections,
                authenticated: authenticatedConnections,
                anonymous: totalConnections - authenticatedConnections
            }
        };
    }
    generateTestToken(username = 'test-user') {
        const userId = `test-${(0, uuid_1.v4)().substring(0, 8)}`;
        const token = this.jwtService.sign({
            sub: userId,
            username: username,
            roles: ['user'],
            isTest: true
        });
        return {
            status: 'success',
            token,
            message: 'TEST TOKEN - FOR DEVELOPMENT USE ONLY'
        };
    }
    async validateUserCredentials(username, password) {
        const userKey = `user:${username}`;
        const userData = await this.redisService.get(userKey);
        if (userData) {
            const user = JSON.parse(userData);
            return user.password === password;
        }
        else if (username && password) {
            await this.redisService.set(userKey, JSON.stringify({
                username,
                password,
                createdAt: new Date().toISOString()
            }), 60 * 60 * 24 * 30);
            return true;
        }
        return false;
    }
    async getUserId(username) {
        const userKey = `user:${username}`;
        const userData = await this.redisService.get(userKey);
        if (userData) {
            const user = JSON.parse(userData);
            if (user.id) {
                return user.id;
            }
            const userId = (0, uuid_1.v4)();
            user.id = userId;
            await this.redisService.set(userKey, JSON.stringify(user), 60 * 60 * 24 * 30);
            return userId;
        }
        return (0, uuid_1.v4)();
    }
    async initialize(initializeDto) {
        try {
            this.logger.log(`Initialize request received: ${JSON.stringify(initializeDto)}`);
            if (initializeDto.event !== 'initialize') {
                throw new common_1.BadRequestException('Event must be "initialize"');
            }
            if (!initializeDto.payload || !Array.isArray(initializeDto.payload.channels)) {
                throw new common_1.BadRequestException('Invalid payload format. Channels array is required.');
            }
            let authenticatedUserId = null;
            if (initializeDto.auth && Object.keys(initializeDto.auth).length > 0) {
                if (initializeDto.auth.token) {
                    try {
                        const payload = await this.clientAuthService.validateToken(initializeDto.auth.token);
                        authenticatedUserId = payload.sub || payload.id;
                        this.logger.log(`Authenticated user: ${authenticatedUserId}`);
                    }
                    catch (error) {
                        this.logger.warn(`Authentication failed: ${error.message}`);
                    }
                }
            }
            const channelResults = await Promise.all(initializeDto.payload.channels.map(async (channelId) => {
                const channelKey = `channel:${channelId}`;
                const channelExists = await this.redisService.exists(channelKey);
                if (!channelExists) {
                    await this.redisService.set(channelKey, JSON.stringify({
                        id: channelId,
                        created: new Date().toISOString(),
                        active: true,
                        creator: authenticatedUserId || 'anonymous'
                    }));
                    this.logger.log(`Created new channel: ${channelId}`);
                    return { channelId, status: 'created' };
                }
                else {
                    this.logger.log(`Channel already exists: ${channelId}`);
                    return { channelId, status: 'exists' };
                }
            }));
            this.wsGateway.joinClientsToChannels(initializeDto.payload.channels);
            return {
                status: 'success',
                message: 'Channels initialized successfully',
                channels: channelResults,
                authenticated: !!authenticatedUserId,
                sessionId: (0, uuid_1.v4)()
            };
        }
        catch (error) {
            this.logger.error(`Channel initialization failed: ${error.message}`);
            throw error;
        }
    }
    async channelBroadcast(broadcastDto) {
        try {
            this.logger.log(`Broadcast request received: ${JSON.stringify(broadcastDto)}`);
            if (broadcastDto.event !== 'broadcast') {
                throw new common_1.BadRequestException('Event must be "broadcast"');
            }
            if (!broadcastDto.channel_ids || !Array.isArray(broadcastDto.channel_ids) || broadcastDto.channel_ids.length === 0) {
                throw new common_1.BadRequestException('Invalid request. At least one channel_id is required.');
            }
            if (!broadcastDto.payload) {
                throw new common_1.BadRequestException('Payload is required');
            }
            for (const channelId of broadcastDto.channel_ids) {
                const channelExists = await this.redisService.exists(`channel:${channelId}`);
                if (!channelExists) {
                    this.logger.warn(`Channel ${channelId} does not exist, but will attempt to broadcast anyway`);
                }
            }
            const messageData = {
                event: 'message',
                data: {
                    ...broadcastDto.payload,
                    _meta: {
                        timestamp: new Date().toISOString(),
                        source: 'api-broadcast',
                        messageId: (0, uuid_1.v4)()
                    }
                }
            };
            const results = broadcastDto.channel_ids.map(channelId => {
                this.wsGateway.server.to(channelId).emit('outgoing_event', messageData);
                this.redisService.publish(`channel:${channelId}`, JSON.stringify(messageData));
                this.logger.log(`Broadcast sent to channel: ${channelId}`);
                return { channelId, status: 'broadcast_sent' };
            });
            return {
                status: 'success',
                message: 'Broadcast sent successfully',
                channels: results,
                messageId: messageData.data._meta.messageId
            };
        }
        catch (error) {
            this.logger.error(`Channel broadcast failed: ${error.message}`);
            throw error;
        }
    }
};
exports.WebSocketController = WebSocketController;
__decorate([
    (0, common_1.Post)('token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], WebSocketController.prototype, "generateToken", null);
__decorate([
    (0, common_1.Post)('validate-token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenValidationDto]),
    __metadata("design:returntype", Promise)
], WebSocketController.prototype, "validateToken", null);
__decorate([
    (0, common_1.Post)('revoke-token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenValidationDto]),
    __metadata("design:returntype", Promise)
], WebSocketController.prototype, "revokeToken", null);
__decorate([
    (0, common_1.Post)('broadcast'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BroadcastDto]),
    __metadata("design:returntype", Promise)
], WebSocketController.prototype, "broadcastMessage", null);
__decorate([
    (0, common_1.Get)('connections'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WebSocketController.prototype, "getConnections", null);
__decorate([
    (0, common_1.Get)('test-token'),
    __param(0, (0, common_1.Query)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WebSocketController.prototype, "generateTestToken", null);
__decorate([
    (0, common_1.Post)('initialize'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [InitializeDto]),
    __metadata("design:returntype", Promise)
], WebSocketController.prototype, "initialize", null);
__decorate([
    (0, common_1.Post)('broadcast'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ChannelBroadcastDto]),
    __metadata("design:returntype", Promise)
], WebSocketController.prototype, "channelBroadcast", null);
exports.WebSocketController = WebSocketController = WebSocketController_1 = __decorate([
    (0, common_1.Controller)('websocket'),
    __metadata("design:paramtypes", [websocket_gateway_1.WSGateway,
        client_auth_service_1.ClientAuthService,
        jwt_1.JwtService,
        redis_service_1.RedisService])
], WebSocketController);
//# sourceMappingURL=websocket.controller.js.map