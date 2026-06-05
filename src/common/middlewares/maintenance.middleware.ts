import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AdminDashboardService } from '../../admin/services/admin-dashboard.service.js';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  // Public paths that visitors can always access (even during maintenance)
  private readonly publicPaths = [
    '/',
    '/config',
    '/auth',
    '/jobs',
    '/content',
    '/translations',
    '/testimonials',
    '/images',
    '/companies',
    '/ratings',
    '/categories',
    '/admin',
    '/monitoring',
    '/push',
    '/maintenance-status',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    if (!AdminDashboardService.maintenanceMode) {
      return next();
    }

    // Check if the path is public (visitors can access these)
    const isPublicPath = this.publicPaths.some(
      (p) => req.path === p || req.path.startsWith(p + '/')
    );

    if (isPublicPath) {
      return next();
    }

    // Check if user is admin based on the JWT token payload
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = token.split('.')[1];
        if (payload) {
          const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
          if (decoded && decoded.adminRole) {
            return next();
          }
        }
      } catch (e) {}
    }

    // Block all other requests (logged-in users doing protected actions)
    throw new ServiceUnavailableException('The system is currently undergoing maintenance. Please try again later.');
  }
}
