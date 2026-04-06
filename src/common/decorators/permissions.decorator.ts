import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export interface PermissionRequirement {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  entity: 'JOB' | 'USER' | 'COMPANY';
}

export const Permissions = (...requirements: PermissionRequirement[]) => 
  SetMetadata(PERMISSIONS_KEY, requirements);
