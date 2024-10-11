import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { AuthService } from '../../modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private reflector: Reflector,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
    @Inject(forwardRef(() => JwtService)) private readonly jwtService: JwtService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.isPublicRoute(context);

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

  private isPublicRoute(context: ExecutionContext) {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  private async handleTokenExpired(request: any, response: any) {
    const { requestId: id, headers } = request;
    const refreshToken = headers['x-refresh-token'];

    if (!refreshToken) throw new HttpException('missing x-refresh-token', HttpStatus.UNAUTHORIZED);

    const passKey = `recentToken:${refreshToken}`;
    const refreshLockKey = `refreshLockKey:${refreshToken}`;

    await this.preventDuplicateTokenRefresh(refreshLockKey);

    const isPassKey = await this.redis.get(passKey);
    if (isPassKey) {
      return this.usePassKey(isPassKey, request, response);
    }

    return this.refreshAccessToken(refreshToken, request, response, passKey, refreshLockKey);
  }

  /** @description 중복 갱신 방지 */
  private async preventDuplicateTokenRefresh(refreshLockKey: string) {
    const inProgress = await this.redis.get(refreshLockKey);

    if (inProgress) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.preventDuplicateTokenRefresh(refreshLockKey);
    }

    await this.redis.set(refreshLockKey, 'true', 'PX', 300);
  }

  /** @description 비동기요청에 대한 RT 재사용 처리 */
  private async usePassKey(passKey: string, request: any, response: any) {
    response.setHeader('x-access-token', passKey);
    request.headers['authorization'] = `Bearer ${passKey}`;
    const decodedToken = this.jwtService.decode(passKey);
    request.user = { id: decodedToken.sub, email: decodedToken.username };

    return true;
  }

  /** @description 만료 AT갱신 */
  private async refreshAccessToken(
    refreshToken: string,
    request: any,
    response: any,
    passKey: string,
    refreshLockKey: string,
  ) {
    const decodedRefreshToken = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const user = await this.authService.validatePayload({
      username: decodedRefreshToken.username,
      sub: decodedRefreshToken.sub,
    });

    await this.validateTokenVersion(decodedRefreshToken, user);
    await this.validateDevice(decodedRefreshToken, request, user);

    return this.issueNewAccessToken(
      decodedRefreshToken,
      request,
      response,
      passKey,
      refreshLockKey,
    );
  }

  private async validateTokenVersion(decodedRefreshToken: any, user: any) {
    if (decodedRefreshToken.tokenVersion !== user.tokenVersion) {
      throw new HttpException('의심스러운 활동이 감지되었습니다.', HttpStatus.UNAUTHORIZED);
    }
  }

  private async validateDevice(decodedRefreshToken: any, request: any, user: any): Promise<void> {
    if (!this.isSameDevice(decodedRefreshToken.device, request.device)) {
      await this.authService.incrementTokenVersion(user);
      await this.redis.del(`user:${decodedRefreshToken.sub}`);
      throw new HttpException(
        '알 수 없는 디바이스 또는 환경에서의 접근 시도가 감지되었습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private async issueNewAccessToken(
    decodedRefreshToken: any,
    request: any,
    response: any,
    passKey: string,
    refreshLockKey: string,
  ): Promise<boolean> {
    const refreshToken = request.headers['x-refresh-token'];
    const newAccessTokens = await this.authService.refreshToken(refreshToken);

    await this.redis.set(passKey, newAccessTokens, 'EX', 5);
    await this.redis.set(`reuseKey:${refreshToken}`, 'used', 'EX', 29 * 60 + 50);
    await this.redis.del(refreshLockKey);

    response.setHeader('x-access-token', newAccessTokens);
    request.headers['authorization'] = `Bearer ${newAccessTokens}`;
    request.user = { id: decodedRefreshToken.sub, email: decodedRefreshToken.username };

    return true;
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
