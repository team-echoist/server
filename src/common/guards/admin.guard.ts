import {
  Injectable,
  ExecutionContext,
  CanActivate,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Observable } from 'rxjs';

import { AdminService } from '../../modules/base/admin/core/admin.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AdminGuard extends AuthGuard('admin-jwt') implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly adminService: AdminService,
    @InjectRedis() private readonly redis: Redis,
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

  private async handleTokenExpired(request: any, response: any): Promise<boolean> {
    const refreshToken = request.headers['x-refresh-token'];
    const adminRecentTokenKey = `recentToken:${refreshToken}:admin`;
    const adminInProgressKey = `inProgress:${refreshToken}:admin`;

    if (!refreshToken)
      throw new HttpException('다음 누락: x-refresh-token', HttpStatus.UNAUTHORIZED);

    /** @description 중복갱신 방지 */
    const inProgress = await this.redis.get(adminInProgressKey);
    if (inProgress) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.handleTokenExpired(request, response);
    }

    await this.redis.set(adminInProgressKey, 'true', 'EX', 5);

    /** @description 리프레쉬 토큰 사용 후 5초간 만료토큰 허용 */
    const adminRecentlyRefreshedToken = await this.redis.get(adminRecentTokenKey);
    if (adminRecentlyRefreshedToken) {
      response.setHeader('x-access-token', adminRecentlyRefreshedToken);
      request.headers['authorization'] = `Bearer ${adminRecentlyRefreshedToken}`;

      const decodedToken = this.jwtService.decode(adminRecentlyRefreshedToken);
      request.user = { id: decodedToken.sub, email: decodedToken.username };

      return true;
    }

    const decodedRefreshToken = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    if (!this.isSameDevice(decodedRefreshToken.device, request.device))
      throw new HttpException(
        '알 수 없는 디바이스 또는 환경에서의 접근 시도가 감지되었습니다.',
        HttpStatus.UNAUTHORIZED,
      );

    const cachedToken = await this.redis.get(`${refreshToken}:${decodedRefreshToken.sub}:admin`);
    if (cachedToken) {
      await this.redis.set(
        `${refreshToken}:${decodedRefreshToken.sub}:admin`,
        'used',
        'EX',
        720 * 60,
      );
      throw new HttpException(
        '잠재적인 토큰 탈취 또는 남용이 감지되었습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    try {
      const newAccessTokens = await this.adminService.adminRefreshToken(refreshToken);

      await this.redis.set(adminRecentTokenKey, newAccessTokens, 'EX', 5);
      await this.redis.set(
        `${refreshToken}:${decodedRefreshToken.sub}:admin`,
        'used',
        'EX',
        29 * 60 + 50,
      );
      await this.redis.del(adminInProgressKey);

      response.setHeader('x-access-token', newAccessTokens);
      request.headers['authorization'] = `Bearer ${newAccessTokens}`;

      request.user = { id: decodedRefreshToken.sub, email: decodedRefreshToken.username };

      return true;
    } catch {
      throw new HttpException('로그인이 만료되었습니다.', HttpStatus.UNAUTHORIZED);
    }
  }

  private isSameDevice(storedDevice: any, currentDevice: any): boolean {
    if (!storedDevice) return false;

    return (
      storedDevice.os === currentDevice.os &&
      storedDevice.type === currentDevice.type &&
      storedDevice.model === currentDevice.model
    );
  }
}
