import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        console.log(
          `${request.method} ${request.url} ${JSON.stringify(request.params)} ${JSON.stringify(request.query)} ${response.statusCode} ${request.headers['user-agent']} ${request.ip} ${duration}ms`,
        );
      }),
    );
  }
}
