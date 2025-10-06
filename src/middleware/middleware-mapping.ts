import { AuthenticationMiddleware } from './middlewares/authentication.middleware';
import { LoggingMiddleware } from './middlewares/logging.middleware';
import { ErrorHandlingMiddleware } from './middlewares/error-handling.middleware';

export const middlewareClassMap = {
  auth: AuthenticationMiddleware,
  log: LoggingMiddleware,
  errorHandling: ErrorHandlingMiddleware,
};

export const middlewareSets = {
  standard: ['auth', 'log'],
};
