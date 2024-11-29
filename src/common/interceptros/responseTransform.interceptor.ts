import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ToolService } from '../../modules/utils/tool/core/tool.service';
import { UserStatus } from '../types/enum.types';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  constructor(private readonly utilsService: ToolService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;
    const timestamp = this.utilsService.newDate();

    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();

        if (!response.headersSent && request.user) {
          if (
            request.user.status !== UserStatus.DEACTIVATED &&
            request.user.deactivationDate !== null &&
            request.user.deactivationDate !== undefined
          ) {
            response.statusCode = HttpStatus.ACCEPTED;
          }
        }

        return {
          success: true,
          timestamp,
          path,
          statusCode: response.statusCode,
          data,
        };
      }),
    );
  }
}
