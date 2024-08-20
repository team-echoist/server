import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';
import { UserStatus } from '../types/enum.types';

@Injectable()
export class UserStatusInterceptor implements NestInterceptor {
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        if (!response.headersSent && request.user) {
          if (request.user.status === UserStatus.BANNED) {
            throw new HttpException(
              '정지된 계정입니다. 자세한 내용은 지원팀에 문의하세요1.',
              HttpStatus.FORBIDDEN,
            );
          }
        }
      }),
    );
  }
}
