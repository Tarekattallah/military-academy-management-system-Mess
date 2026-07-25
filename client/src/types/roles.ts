export interface Permission {
  _id: string;
  code: string;
  module: string;
  action: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleFormValues {
  name: string;
  description?: string;
  permissions: string[];
}
