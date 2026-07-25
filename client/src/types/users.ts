export interface UserRole {
  _id: string;
  name: string;
}

export interface User {
  _id: string;
  username: string;
  email?: string;
  displayName: string;
  roles: UserRole[];
  status: 'active' | 'inactive' | 'locked';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFormValues {
  username: string;
  displayName: string;
  email?: string;
  password: string;
  confirmPassword: string;
  roles: string[];
  status: 'active' | 'inactive' | 'locked';
}

export interface UserUpdateValues {
  displayName?: string;
  email?: string;
  password?: string;
  roles?: string[];
  status?: 'active' | 'inactive' | 'locked';
}
