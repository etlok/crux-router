import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export const winstonLoggerOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike('App', { prettyPrint: true }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/app.log',
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};