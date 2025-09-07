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
var WSGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const redis_service_1 = require("../../redis/redis.service");
const router_service_1 = require("../../router/router.service");
const common_1 = require("@nestjs/common");
const event_payload_dto_1 = require("./dto/event-payload.dto");
const uuid_1 = require("uuid");
const client_auth_service_1 = require("./client-auth.service");
let WSGateway = WSGateway_1 = class WSGateway {
    redisService;
    routerService;
    clientAuthService;
    server;
    redisSubscribed = false;
    maxRetries = 5;
    logger = new common_1.Logger(WSGateway_1.name);
    rateLimiter = new Map();
    RATE_LIMIT = 50;
    RATE_WINDOW = 60000;
    connectedClients = new Set();
    authenticatedClients = new Set();
    constructor(redisService, routerService, clientAuthService) {
        this.redisService = redisService;
        this.routerService = routerService;
        this.clientAuthService = clientAuthService;
    }
    async afterInit() {
        this.logger.log('WebSocket Gateway initialized');
        await this.subscribeToWorkerResponses();
    }
    async subscribeToWorkerResponses(retryCount = 0) {
        try {
            if (!this.redisSubscribed) {
                await this.redisService.subscribe('worker_responses', (message) => {
                    this.logger.log(` ----- Worker response from Redis: ${message}`);
                    const response = JSON.parse(message);
                    if (response.room) {
                        this.server.to(response.room).emit('outgoing_event', response);
                    }
                    else if (response.clientId) {
                        this.server.to(response.clientId).emit('outgoing_event', response);
                    }
                    else {
                        this.server.emit('outgoing_event', response);
                    }
                });
                this.redisSubscribed = true;
                this.logger.log('Subscribed to worker_responses');
            }
        }
        catch (err) {
            this.logger.error(`Redis subscribe error: ${err.message}`);
            if (retryCount < this.maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000;
                setTimeout(() => this.subscribeToWorkerResponses(retryCount + 1), delay);
            }
            else {
                this.logger.error('Max Redis subscribe retries reached');
            }
        }
    }
    async handleConnection(client) {
        const token = client.handshake.auth.token ||
            client.handshake.headers['authorization']?.replace('Bearer ', '');
        client.data.token = token;
        if (!token) {
            this.logger.warn(`Client connected without token: ${client.id}`);
            setTimeout(() => {
                if (!this.authenticatedClients.has(client.id)) {
                    client.disconnect(true);
                    this.logger.warn(`Disconnected unauthenticated client: ${client.id}`);
                }
            }, 10000);
        }
        else {
            try {
                const payload = await this.clientAuthService.validateToken(token);
                client.data.user = payload;
                this.authenticatedClients.add(client.id);
                this.logger.log(`Authenticated client connected: ${client.id}, user: ${payload.sub || payload.id || 'unknown'}`);
            }
            catch (err) {
                this.logger.warn(`Client with invalid token rejected: ${client.id}`);
                client.disconnect(true);
                return;
            }
        }
        this.connectedClients.add(client.id);
        this.logger.log(`Client connected: ${client.id}, total: ${this.connectedClients.size}`);
    }
    handleDisconnect(client) {
        this.connectedClients.delete(client.id);
        this.authenticatedClients.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id}, remaining: ${this.connectedClients.size}`);
        if (this.connectedClients.size === 0 && this.redisSubscribed) {
            this.redisService.unsubscribe('worker_responses');
            this.redisSubscribed = false;
            this.logger.log('No connected clients, unsubscribed from Redis');
        }
    }
    async handleAuthenticate(data, client) {
        if (!data || !data.token) {
            return { status: 'error', message: 'JWT token is required' };
        }
        try {
            client.data.token = data.token;
            const payload = await this.clientAuthService.validateToken(data.token);
            client.data.user = payload;
            this.authenticatedClients.add(client.id);
            this.logger.log(`Client authenticated: ${client.id}, user: ${payload.sub || payload.id || 'unknown'}`);
            return {
                status: 'success',
                message: 'Authentication successful',
                user: {
                    id: payload.sub || payload.id,
                    roles: payload.roles || [],
                    name: payload.name
                }
            };
        }
        catch (err) {
            this.logger.warn(`Authentication failed for client: ${client.id} - ${err.message}`);
            return {
                status: 'error',
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            };
        }
    }
    async handleEvent(data, client) {
        const clientId = client.id;
        if (!this.authenticatedClients.has(client.id)) {
            this.logger.warn(`Unauthenticated event from client: ${client.id}`);
            return {
                status: 'error',
                code: 'UNAUTHORIZED',
                message: 'Authentication required. Please authenticate first.',
                timestamp: new Date().toISOString()
            };
        }
        const now = Date.now();
        let limit = this.rateLimiter.get(clientId);
        if (!limit || now > limit.resetTime) {
            limit = { count: 1, resetTime: now + this.RATE_WINDOW };
            this.rateLimiter.set(clientId, limit);
        }
        else if (limit.count >= this.RATE_LIMIT) {
            this.logger.warn(`Rate limit exceeded for client ${clientId}`);
            return { status: 'error', message: 'Rate limit exceeded. Try again later.' };
        }
        else {
            limit.count++;
        }
        this.logger.log(`Received WebSocket event: ${JSON.stringify(data)}`);
        try {
            if (!data || !data.event) {
                throw new websockets_1.WsException('Invalid event format: missing event name');
            }
            const { event, payload } = data;
            const enhancedPayload = {
                ...payload,
                _meta: {
                    userId: client.data.user?.sub || client.data.user?.id,
                    socketId: client.id,
                    roles: client.data.user?.roles || [],
                    token: client.data.token
                }
            };
            const requestId = (0, uuid_1.v4)();
            this.logger.log(`[${requestId}] Received WebSocket event: ${event}`);
            const result = await this.routerService.routeEvent(event, enhancedPayload);
            return {
                status: 'success',
                requestId,
                timestamp: new Date().toISOString(),
                data: result
            };
        }
        catch (err) {
            this.logger.error(`Failed to route event: ${err.message}`);
            return {
                status: 'error',
                code: err.code || 'INTERNAL_ERROR',
                message: err.message || 'An unexpected error occurred',
                timestamp: new Date().toISOString()
            };
        }
    }
    broadcastEvent(event) {
        this.logger.log(`Broadcasting event: ${JSON.stringify(event)}`);
        this.server.emit('outgoing_event', event);
    }
    handleJoinRoom(data, client) {
        client.join(data.room);
        return { status: 'ok', room: data.room };
    }
    handleIncomingEvent(event) {
        this.logger.log(`incoming event: ${JSON.stringify(event)}`);
        this.server.emit('incoming_event', event);
    }
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
    getAuthenticatedClientsCount() {
        return this.authenticatedClients.size;
    }
};
exports.WSGateway = WSGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WSGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('authenticate'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], WSGateway.prototype, "handleAuthenticate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('incoming_event'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [event_payload_dto_1.EventPayloadDto, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], WSGateway.prototype, "handleEvent", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WSGateway.prototype, "handleJoinRoom", null);
exports.WSGateway = WSGateway = WSGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: true }),
    __metadata("design:paramtypes", [redis_service_1.RedisService, router_service_1.RouterService,
        client_auth_service_1.ClientAuthService])
], WSGateway);
//# sourceMappingURL=websocket.gateway.js.map