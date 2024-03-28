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

    if (status >= 500) {
      this.logger.error(
        `${message}\nRequest: \n${JSON.stringify(
          request.body,
          null,
          2,
        )} \nResponse: \n${JSON.stringify(error, null, 2)}`,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${message}\nRequest: \n${JSON.stringify(
          request.body,
          null,
          2,
        )} \nResponse: \n${JSON.stringify(error, null, 2)}`,
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
