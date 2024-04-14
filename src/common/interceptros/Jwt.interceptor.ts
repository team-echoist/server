import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';
import { generateJWT } from '../utils/jwt.utils';

/**
 * @title jwt 발급 및 갱신 자동화를 위한 인터셉터
 * @description 응답 객체에 user가 존재하면 (인증, 인가 통과 유저) jwt를 발급 또는 갱신 합니다.
 */
@Injectable()
export class JwtInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        if (!response.headersSent && request.user) {
          const newJwt = generateJWT(request.user.id, request.user.email);
          response.setHeader('Authorization', `Bearer ${newJwt}`);
        }
      }),
    );
  }
}
