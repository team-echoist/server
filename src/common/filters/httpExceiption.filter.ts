import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { UtilsService } from '../../modules/utils/utils.service';

interface CustomError {
  message: string | string[];
  error: string;
  statusCode?: number;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly utilsService: UtilsService) {}

  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const { ip, method, originalUrl: url } = request;
    const userAgent = request.get('UserEntity-Agent') || '';
    const message = `${method} ${url} ${status} - ${userAgent} ${ip}`;

    const originalError = exception.getResponse();
    let errorResponse: any;

    if (isCustomError(originalError)) {
      const { statusCode: errorStatusCode, ...restError } = originalError;
      errorResponse = restError;
    } else if (typeof originalError === 'string') {
      errorResponse = { message: originalError };
    }

    const errorStack = exception.stack;

    if (status >= 500) {
      this.logger.error(
        `${message}\nRequest: ${JSON.stringify(request.body)}\nResponse: ${JSON.stringify(originalError)}\nStack Trace: ${JSON.stringify(errorStack)}`,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${message}\nRequest: ${JSON.stringify(request.body)}\nResponse: ${JSON.stringify(originalError)}\nStack Trace: ${JSON.stringify(errorStack)}`,
      );
    }

    response.status(status).json({
      success: false,
      timestamp: this.utilsService.newDate(),
      path: request.url,
      error: errorResponse,
      statusCode: status,
    });
  }
}

function isCustomError(error: any): error is CustomError {
  return typeof error === 'object' && 'message' in error && 'error' in error;
}
