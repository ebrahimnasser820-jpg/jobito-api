import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AdminDashboardService } from '../../admin/services/admin-dashboard.service.js';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (AdminDashboardService.maintenanceMode) {
      // Allow specific paths that should bypass maintenance (e.g., config, root ping)
      if (req.path === '/' || req.path === '/config' || req.path.startsWith('/admin')) {
        return next();
      }

      // Check if user is admin based on the JWT token payload (without full verification, which happens later in guards)
      const authHeader = req.headers.authorization;
      let isAdmin = false;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const payload = token.split('.')[1];
          if (payload) {
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
            if (decoded && decoded.adminRole) {
              isAdmin = true;
            }
          }
        } catch (e) {}
      }

      if (!isAdmin) {
        throw new ServiceUnavailableException('The system is currently undergoing maintenance. Please try again later.');
      }
    }
    next();
  }
}
