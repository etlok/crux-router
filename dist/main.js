"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const nest_winston_1 = require("nest-winston");
const winston_logger_1 = require("./logger/winston-logger");
const common_1 = require("@nestjs/common");
const redisio_adapter_1 = require("./router/redisio-adapter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: nest_winston_1.WinstonModule.createLogger(winston_logger_1.winstonLoggerOptions),
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const redisIoAdapter = new redisio_adapter_1.RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map