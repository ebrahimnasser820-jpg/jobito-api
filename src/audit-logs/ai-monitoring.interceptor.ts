import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AiMonitoringService } from './ai-monitoring.service.js';

@Injectable()
export class AiMonitoringInterceptor implements NestInterceptor {
  constructor(private readonly aiService: AiMonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const { method, url, body: reqBody, user } = request;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (resBody) => {
          const duration = Date.now() - startTime;
          // Trigger AI analysis in background
          this.aiService.analyzeTraffic({
            method,
            url,
            reqBody,
            resBody,
            userId: user?.userId || 'GUEST',
            duration,
            statusCode: context.switchToHttp().getResponse().statusCode,
          }).catch(err => console.error('AI Monitoring Background Error:', err));
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.aiService.analyzeTraffic({
            method,
            url,
            reqBody,
            resBody: { error: err.message, stack: err.stack },
            userId: user?.userId || 'GUEST',
            duration,
            statusCode: err.status || 500,
          }).catch(ae => console.error('AI Monitoring Background Error (on request error):', ae));
        }
      }),
    );
  }
}
