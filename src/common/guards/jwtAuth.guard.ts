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
    const recentTokenKey = `recentToken:${refreshToken}`;
    const inProgressKey = `inProgress:${refreshToken}`;

    if (!refreshToken)
      throw new HttpException('다음 누락: x-refresh-token', HttpStatus.UNAUTHORIZED);

    /** @description 중복갱신 방지 */
    const inProgress = await this.redis.get(inProgressKey);
    if (inProgress) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.handleTokenExpired(request, response);
    }

    await this.redis.set(inProgressKey, 'true', 'PX', 300);

    /** @description 리프레쉬 토큰 사용 후 5초간 만료토큰 허용 */
    const recentlyRefreshedToken = await this.redis.get(recentTokenKey);
    if (recentlyRefreshedToken) {
      response.setHeader('x-access-token', recentlyRefreshedToken);
      request.headers['authorization'] = `Bearer ${recentlyRefreshedToken}`;

      const decodedToken = this.jwtService.decode(recentlyRefreshedToken);
      request.user = { id: decodedToken.sub, email: decodedToken.username };

      return true;
    }

    const decodedRefreshToken = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const user = await this.authService.validatePayload({
      username: decodedRefreshToken.username,
      sub: decodedRefreshToken.sub,
    });

    if (decodedRefreshToken.tokenVersion !== user.tokenVersion) {
      throw new HttpException(
        '잠재적인 위협이 감지되어 토큰이 무효화 되었습니다. 다시 로그인 해주세요.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!this.isSameDevice(decodedRefreshToken.device, request.device)) {
      await this.authService.incrementTokenVersion(user);
      await this.redis.del(`user:${decodedRefreshToken.sub}`);
      throw new HttpException(
        '알 수 없는 디바이스 또는 환경에서의 접근 시도가 감지되었습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const cachedToken = await this.redis.get(`${refreshToken}:${decodedRefreshToken.sub}`);
    if (cachedToken) {
      await this.authService.incrementTokenVersion(user);
      await this.redis.del(`user:${decodedRefreshToken.sub}`);
      throw new HttpException(
        '잠재적인 토큰 탈취 또는 남용이 감지되었습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const newAccessTokens = await this.authService.refreshToken(refreshToken);

      await this.redis.set(recentTokenKey, newAccessTokens, 'EX', 5);
      await this.redis.set(
        `${refreshToken}:${decodedRefreshToken.sub}`,
        'used',
        'EX',
        29 * 60 + 50,
      );
      await this.redis.del(inProgressKey);

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
