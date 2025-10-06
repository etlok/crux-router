import { Socket } from 'socket.io';
export declare class ExampleWebSocketGateway {
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handlePing(client: Socket, data: any): {
        event: string;
        data: {
            received: any;
            sent: number;
        };
    };
    handleAuthenticate(client: Socket, data: any): Promise<{
        event: string;
        data: {
            success: boolean;
            message: string;
            user: {
                id: any;
                name: any;
            };
        };
    } | {
        event: string;
        data: {
            success: boolean;
            message: any;
            user?: undefined;
        };
    }>;
    handleProtected(client: Socket, data: any): {
        event: string;
        data: {
            message: string;
            user: any;
            receivedData: any;
        };
    } | undefined;
    handleError(): void;
}
