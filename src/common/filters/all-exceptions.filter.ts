import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { LogsService } from '../../monitoring/services/logs.service.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logsService: LogsService,
  ) {}

  async catch(exception: any, host: ArgumentsHost): Promise<void> {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const request = ctx.getRequest();
    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      message: exception.message || 'Internal server error',
    };

    // Feed to Monitoring System
    await this.logsService.logError(exception, {
      path: responseBody.path,
      statusCode: httpStatus,
      method: request.method,
    });

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
