import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../../modules/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private reflector: Reflector,
    private authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

      throw new HttpException(
        '의심스러운 활동이 감지되었습니다. 잘못된 토큰입니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  private async handleTokenExpired(request: any, response: any): Promise<boolean> {
    const refreshToken = request.headers['x-refresh-token'];
    const cachedKey = `accessToken:${refreshToken}`;
    const cachedToken = await this.redis.get(cachedKey);

    if (!refreshToken)
      throw new HttpException('다음 누락: "x-refresh-token"', HttpStatus.UNAUTHORIZED);

    const decodedRefreshToken = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    const storedDevice = await this.redis.get(`device:${decodedRefreshToken.sub}`);

    if (!this.isSameDevice(storedDevice, request.device))
      throw new HttpException(
        '알 수 없는 디바이스 또는 위치에서의 접근 시도가 감지되었습니다. 다시 로그인 해주세요.',
        HttpStatus.UNAUTHORIZED,
      );

    if (cachedToken)
      throw new HttpException(
        '새로운 액세스 토큰이 사용되지 않았습니다. 잠재적인 남용이 감지되었습니다.',
        HttpStatus.UNAUTHORIZED,
      );

    try {
      const newAccessTokens = await this.authService.refreshToken(refreshToken);

      await this.redis.set(cachedKey, 'used', 'EX', 29 * 60);

      response.setHeader('x-access-token', newAccessTokens);
      request.headers['authorization'] = `Bearer ${newAccessTokens}`;

      request.user = { userId: decodedRefreshToken.sub, email: decodedRefreshToken.username };

      return true;
    } catch {
      throw new HttpException('로그인이 만료되었습니다.', HttpStatus.UNAUTHORIZED);
    }
  }

  private isSameDevice(storedDevice: string, currentDevice: any): boolean {
    if (!storedDevice) return false;

    const parsedStoredDevice = JSON.parse(storedDevice);

    return (
      parsedStoredDevice.os === currentDevice.os &&
      parsedStoredDevice.type === currentDevice.type &&
      parsedStoredDevice.model === currentDevice.model
    );
  }
}
