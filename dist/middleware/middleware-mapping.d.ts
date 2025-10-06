import { AuthenticationMiddleware } from './middlewares/authentication.middleware';
import { LoggingMiddleware } from './middlewares/logging.middleware';
import { ErrorHandlingMiddleware } from './middlewares/error-handling.middleware';
export declare const middlewareClassMap: {
    auth: typeof AuthenticationMiddleware;
    log: typeof LoggingMiddleware;
    errorHandling: typeof ErrorHandlingMiddleware;
};
export declare const middlewareSets: {
    standard: string[];
};
