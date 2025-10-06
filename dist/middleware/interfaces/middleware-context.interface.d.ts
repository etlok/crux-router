export interface MiddlewareContext {
    client?: any;
    event: string;
    data: any;
    sourceContext: any;
    middlewareResults: Record<string, any>;
    error?: Error;
    [key: string]: any;
}
