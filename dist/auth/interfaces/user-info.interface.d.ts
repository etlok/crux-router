export interface UserInfo {
    sub: string;
    entities?: string[];
    roles?: string[];
    permissions?: string[];
    [key: string]: any;
}
