import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../entities/admin.entity.js';
import { ADMIN_ROLES_KEY } from '../guards/admin-roles.guard.js';

/**
 * Decorator to specify which admin roles are allowed to access a route.
 * @example @AdminRolesAllowed(AdminRole.SUPER_ADMIN)
 * @example @AdminRolesAllowed(AdminRole.SUPER_ADMIN, AdminRole.OPERATION_MANAGER)
 */
export const AdminRolesAllowed = (...roles: AdminRole[]) => SetMetadata(ADMIN_ROLES_KEY, roles);
