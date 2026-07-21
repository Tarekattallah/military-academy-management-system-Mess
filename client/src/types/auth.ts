export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
