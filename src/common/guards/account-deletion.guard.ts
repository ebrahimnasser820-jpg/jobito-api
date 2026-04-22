import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AccountDeletionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user exists and has a deletion scheduling timestamp
    if (user && user.deletionRequestedAt) {
      const path = request.url;
      const method = request.method;

      // Allow only safe actions: cancel deletion and auth-related status checks
      const isExempt = 
        (path.includes('/users/me/cancel-deletion') && method === 'PATCH') ||
        (path.includes('/users/me/deletion-status') && method === 'GET') ||
        (path.includes('/auth/logout') && method === 'POST');

      if (!isExempt) {
        throw new ForbiddenException({
          message: 'Your account is scheduled for deletion.',
          error: 'AccountDeletionScheduled',
          deletionRequestedAt: user.deletionRequestedAt,
          description: 'Please cancel the deletion request to perform this action.'
        });
      }
    }

    return true;
  }
}
