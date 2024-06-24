import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';
import { UtilsService } from '../../modules/utils/utils.service';

/**
 * @title jwt 발급 및 갱신 자동화를 위한 인터셉터
 * @description 응답 객체에 user가 존재하면 (인증, 인가 통과 유저) jwt를 발급 또는 갱신 합니다.
 */
@Injectable()
export class JwtInterceptor implements NestInterceptor {
  constructor(private readonly utilsService: UtilsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        if (!response.headersSent && request.user) {
          if (request.user.activated === undefined && request.user.deactivationDate !== null) {
            response.statusCode = HttpStatus.ACCEPTED;
          }
          const newJwt = this.utilsService.generateJWT(request.user.id, request.user.email);
          response.setHeader('Authorization', `Bearer ${newJwt}`);
        }
      }),
    );
  }
}
