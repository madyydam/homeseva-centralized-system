export interface SessionUser {
  id: string;
  roleId: string;
  businessId: string | null;
  isSuperAdmin: boolean;
  isOwner: boolean;
  permissions: Permission[];
}

export interface Permission {
  module: string;
  action: string;
  scope: PermissionScope;
}

export type PermissionScope = 'group' | 'business' | 'department' | 'team' | 'own';

export interface SignInRequest {
  roleId: string;
  password: string;
  businessSlug: string;
}

export interface SignInResponse {
  success: boolean;
  mustChangePass: boolean;
  requiresTwoFactor: boolean;
}
