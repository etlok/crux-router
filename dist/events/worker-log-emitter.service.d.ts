import { Server } from 'socket.io';
export declare class WorkerLogEmitterService {
    private server;
    private readonly logger;
    emitWorkerLog(logMessage: string): void;
    setServer(server: Server): void;
}
