import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '../entities/admin.entity.js';

export const ADMIN_ROLES_KEY = 'admin_roles';

/**
 * Guard to check if the authenticated admin has the required role.
 * Usage: @AdminRolesAllowed(AdminRole.SUPER_ADMIN)
 */
@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // If no roles are required, allow access to any authenticated admin
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = ctx.switchToHttp().getRequest();
    
    if (!user || !user.adminRole) {
      throw new ForbiddenException('Access denied. Admin privileges required.');
    }

    const hasRole = requiredRoles.includes(user.adminRole);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Required role: ${requiredRoles.join(' or ')}`);
    }

    return true;
  }
}
