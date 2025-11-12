export interface UserInfo {
  sub: string;  // User ID
  entities?: string[];  // Array of entity IDs the user has access to
  roles?: string[];  // User roles
  permissions?: string[];  // User permissions
  [key: string]: any;  // Additional custom fields
}