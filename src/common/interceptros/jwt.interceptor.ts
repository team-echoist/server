import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';
import { UtilsService } from '../../modules/utils/utils.service';

@Injectable()
export class JwtInterceptor implements NestInterceptor {
  constructor(private readonly utilsService: UtilsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        if (request.user) {
          const newJwt = this.utilsService.generateJWT(request.user.id);
          response.setHeader('Authorization', `Bearer ${newJwt}`);
        }
      }),
    );
  }
}
