import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const error = exception.getResponse();

    const { ip, method, originalUrl: url } = request;
    const userAgent = request.get('UserEntity-Agent') || '';
    const message = `${method} ${url} ${status} - ${userAgent} ${ip}`;

    const errorStack = exception.stack;

    if (status >= 500) {
      this.logger.error(
        `${message}\nRequest: ${JSON.stringify(request.body)}\nResponse: ${JSON.stringify(error)}\nStack Trace: ${JSON.stringify(errorStack)}`,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${message}\nRequest: ${JSON.stringify(request.body)}\nResponse: ${JSON.stringify(error)}\nStack Trace: ${JSON.stringify(errorStack)}`,
      );
    }

    response.status(status).json({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
    });
  }
}
