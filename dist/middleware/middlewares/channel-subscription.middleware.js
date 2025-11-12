"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ChannelSubscriptionMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelSubscriptionMiddleware = void 0;
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const base_middleware_1 = require("../base.middleware");
let ChannelSubscriptionMiddleware = ChannelSubscriptionMiddleware_1 = class ChannelSubscriptionMiddleware extends base_middleware_1.BaseMiddleware {
    logger = new common_1.Logger(ChannelSubscriptionMiddleware_1.name);
    async execute(context, next) {
        const { isAuthenticated, userId, userInfo, socket } = context;
        if (!socket || !(socket instanceof socket_io_1.Socket)) {
            this.logger.warn('No valid socket found in context');
            await next();
            return;
        }
        if (isAuthenticated && userId) {
            const userChannel = `user:${userId}`;
            socket.join(userChannel);
            this.logger.log(`Subscribed user ${userId} to channel: ${userChannel}`);
            if (userInfo && Array.isArray(userInfo.entities)) {
                userInfo.entities.forEach((entityId) => {
                    const entityChannel = `entity:${entityId}`;
                    socket.join(entityChannel);
                    this.logger.log(`Subscribed user ${userId} to entity channel: ${entityChannel}`);
                });
            }
            if (context.metadata && context.metadata.middlewareResults) {
                context.metadata.middlewareResults.channelSubscription = {
                    userId,
                    subscribedChannels: [
                        userChannel,
                        ...(userInfo?.entities?.map(id => `entity:${id}`) || [])
                    ],
                    timestamp: new Date().toISOString()
                };
            }
        }
        else {
            this.logger.warn('Auth portion Failed, skipping channel subscription');
        }
        await next();
    }
};
exports.ChannelSubscriptionMiddleware = ChannelSubscriptionMiddleware;
exports.ChannelSubscriptionMiddleware = ChannelSubscriptionMiddleware = ChannelSubscriptionMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, base_middleware_1.Middleware)({ priority: 20 })
], ChannelSubscriptionMiddleware);
//# sourceMappingURL=channel-subscription.middleware.js.map