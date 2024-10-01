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
    const id = request.requestId;
    console.log(`${id}:AT가 만료되어 갱신 핸들러 진입`);
    const refreshToken = request.headers['x-refresh-token'];
    console.log(`${id}:사용할 RT:`, refreshToken);

    const passKey = `recentToken:${refreshToken}`;
    const inProgressKey = `inProgress:${refreshToken}`;

    if (!refreshToken)
      throw new HttpException('다음 누락: x-refresh-token', HttpStatus.UNAUTHORIZED);

    const inProgress = await this.redis.get(inProgressKey);
    console.log(`${id}:중복 갱신 확인`);
    if (inProgress) {
      console.log(`${id}:중복 갱신 발견, 재시도`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.handleTokenExpired(request, response);
    }

    await this.redis.set(inProgressKey, 'true', 'PX', 300);
    console.log('갱신 시작');

    /** @description 리프레쉬 토큰 사용 후 5초간 만료토큰 허용 */
    const isPassKey = await this.redis.get(passKey);

    console.log('리프레쉬 토큰 사용 후 5초간 만료토큰 허용을 위한 PASS KEY 확인: ', isPassKey);
    if (isPassKey) {
      console.log(`${id}:PASS키 존재. 비동기요청 정상처리`);
      response.setHeader('x-access-token', isPassKey);
      request.headers['authorization'] = `Bearer ${isPassKey}`;

      const decodedToken = this.jwtService.decode(isPassKey);
      request.user = { id: decodedToken.sub, email: decodedToken.username };

      console.log(
        `${id}:PASS키 사용 후 예상되는 동작은 통신 종료이므로 마지막 로그가 되어야합니다.`,
      );
      return true;
    }
    console.log(`${id}:PASS KEY 없음. 다음 코드 진행`);

    const decodedRefreshToken = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const user = await this.authService.validatePayload({
      username: decodedRefreshToken.username,
      sub: decodedRefreshToken.sub,
    });

    console.log(`${id}:RT 토큰버전:`, decodedRefreshToken.tokenVersion);
    console.log(`${id}:유저 토큰버전:`, user.tokenVersion);
    console.log(`${id}:일치검사결과:`, decodedRefreshToken.tokenVersion === user.tokenVersion);

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

    const reuseKey = `${refreshToken}:${decodedRefreshToken.sub}`;

    const isReuseKey = await this.redis.get(reuseKey);
    console.log(`${id}:RT 쿨타임 조회:`, isReuseKey);
    if (isReuseKey) {
      console.log(`${id}:RT 재사용 쿨타임 감지`);
      await this.authService.incrementTokenVersion(user);
      await this.redis.del(`user:${decodedRefreshToken.sub}`);
      throw new HttpException(
        '잠재적인 토큰 탈취 또는 남용이 감지되었습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      console.log(`${id}:RT 쿨타임 정상 / 환경변화 감지 안됨`);
      const newAccessTokens = await this.authService.refreshToken(refreshToken);

      await this.redis.set(passKey, newAccessTokens, 'EX', 5);
      await this.redis.set(reuseKey, 'used', 'EX', 29 * 60 + 50);
      await this.redis.del(inProgressKey);

      response.setHeader('x-access-token', newAccessTokens);
      request.headers['authorization'] = `Bearer ${newAccessTokens}`;

      request.user = { id: decodedRefreshToken.sub, email: decodedRefreshToken.username };

      console.log(`${id}:AT 갱신`);
      console.log(`${id}:갱신 종료`);
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
