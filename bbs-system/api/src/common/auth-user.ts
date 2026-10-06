import { RoleCode } from './enums';

export interface AuthUser {
  id: string;
  email: string;
  roles: RoleCode[];
}

export const isManager = (u: AuthUser) => u.roles.includes('admin') || u.roles.includes('ehs_manager');
