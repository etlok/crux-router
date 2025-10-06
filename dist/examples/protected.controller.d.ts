export declare class ProtectedController {
    publicEndpoint(): {
        message: string;
    };
    privateEndpoint(): {
        message: string;
    };
    userInfo(req: any): {
        message: string;
        user: any;
    };
}
