import { Response } from 'express';
export declare class MiddlewareCodeController {
    getMiddlewareCode(key: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
