import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UtilsService } from '../../modules/utils/utils.service';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  constructor(private readonly utilsService: UtilsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.url;
    const timestamp = this.utilsService.newDate();

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
