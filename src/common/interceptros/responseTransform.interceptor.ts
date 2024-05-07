import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.url;
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        timestamp,
        path,
        data,
      })),
    );
  }
}
