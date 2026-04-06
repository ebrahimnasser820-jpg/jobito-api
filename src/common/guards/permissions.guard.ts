import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionRequirement } from '../decorators/permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role) {
      throw new ForbiddenException('Access Denied: No Role Assigned');
    }

    // AI/Suspicious Behavior Check (Pseudo-logic)
    // If user has done too many actions recently, block them
    if (user.isSuspicious) {
      throw new ForbiddenException('Access Denied: Suspicious Activity Detected');
    }

    // Role-based logic
    if (user.role === 'admin') return true;

    // Simple permission logic for this example
    // In a real app, you'd fetch user.permissions from the DB/JWT
    const userPermissions = user.permissions || [];
    
    const hasPermission = requiredPermissions.every((req) =>
      userPermissions.some(
        (p) => p.action === req.action && p.entity === req.entity
      ) || this.checkImplicitPermissions(user.role, req)
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permissions');
    }

    return true;
  }

  private checkImplicitPermissions(role: string, req: PermissionRequirement): boolean {
    const roleMap = {
      manager: ['CREATE_JOB', 'UPDATE_JOB', 'READ_JOB', 'READ_USER'],
      company: ['CREATE_JOB', 'UPDATE_JOB', 'READ_JOB'],
      student: ['READ_JOB'],
    };

    const permString = `${req.action}_${req.entity}`;
    return roleMap[role]?.includes(permString) || false;
  }
}
