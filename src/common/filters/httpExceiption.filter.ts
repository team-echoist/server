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
    const userAgent = request.get('User-Agent') || request.headers['user-agent'];
    const params = request.params;
    const query = request.query;

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

    // todo joke
    if (status === 404) {
      response.redirect('https://linkedoutapp.com');
    }

    if (status >= 500) {
      this.logger.error(
        `${message} Request Body: ${JSON.stringify(request.body)} Request Params: ${JSON.stringify(params)} Request Query: ${JSON.stringify(query)} Response: ${JSON.stringify(originalError)} Stack Trace: ${JSON.stringify(errorStack)}`,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${message} Request Body: ${JSON.stringify(request.body)} Request Params: ${JSON.stringify(params)} Request Query: ${JSON.stringify(query)} Response: ${JSON.stringify(originalError)} Stack Trace: ${JSON.stringify(errorStack)}`,
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
