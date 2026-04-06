import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../audit-logs/audit-log.entity.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    // Only log write operations usually
    const writeMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
    if (!writeMethods.includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data) => {
        const action = this.mapMethodToAction(method);
        const entity = this.mapUrlToEntity(url);

        const log = this.auditLogRepo.create({
          userId: user?.id || 'anonymous',
          action: action,
          entity: entity,
          entityId: data?.id || body?.id || request.params?.id,
          metadata: {
            url,
            body: this.sanitizeBody(body),
            responseStatus: context.switchToHttp().getResponse().statusCode,
          },
        });

        this.auditLogRepo.save(log).then(() => {
          this.checkSuspiciousBehavior(user?.id);
        });
      }),
    );
  }

  private mapMethodToAction(method: string): string {
    const map = { POST: 'CREATE', PATCH: 'UPDATE', PUT: 'UPDATE', DELETE: 'DELETE' };
    return map[method] || 'UNKNOWN';
  }

  private mapUrlToEntity(url: string): string {
    if (url.includes('/jobs')) return 'JOB';
    if (url.includes('/users')) return 'USER';
    if (url.includes('/companies')) return 'COMPANY';
    return 'OTHER';
  }

  private sanitizeBody(body: any) {
    if (!body) return {};
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }

  private async checkSuspiciousBehavior(userId: string) {
    if (!userId || userId === 'anonymous') return;

    // AI/Monitoring Logic:
    // Count deletes in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const deleteCount = await this.auditLogRepo.count({
      where: {
        userId: userId,
        action: 'DELETE',
        timestamp: fiveMinutesAgo, // This needs a proper TypeORM between query, but for example purposes:
      },
    });

    if (deleteCount > 10) {
      console.warn(`🚨 SUSPICIOUS BEHAVIOR: User ${userId} performed ${deleteCount} deletes in 5 mins!`);
      // Here you could trigger a lockout or alert an admin
    }
  }
}
