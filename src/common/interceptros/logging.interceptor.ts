import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly excludedUrls = ['/api/auth/health-check'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = Date.now();

    if (this.isExcludedUrl(request.url)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        console.log(
          `${request.method} ${request.url} ${JSON.stringify(request.params)} ${JSON.stringify(request.query)} ${response.statusCode} ${request.headers['user-agent']} ${request.ip} ${duration}ms`,
        );
      }),
    );
  }

  private isExcludedUrl(url: string): boolean {
    return this.excludedUrls.includes(url);
  }
}
