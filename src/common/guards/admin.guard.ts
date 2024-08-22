import {
  Injectable,
  ExecutionContext,
  CanActivate,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard extends AuthGuard('admin-jwt') implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new HttpException('로그인이 필요한 서비스입니다.', HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    try {
      this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') return this.handleTokenExpired(request, response);
      throw new HttpException('의심스러운 활동이 감지되었습니다.', HttpStatus.UNAUTHORIZED);
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
