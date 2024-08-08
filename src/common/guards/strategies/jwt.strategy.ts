import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../../../modules/auth/auth.service';
import * as dotenv from 'dotenv';
import { UserStatus } from '../../../entities/user.entity';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validatePayload(payload.id);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.status === UserStatus.BANNED) {
      throw new HttpException(
        '정지된 계정입니다. 자세한 내용은 지원팀에 문의하세요.',
        HttpStatus.FORBIDDEN,
      );
    }

    return user;
  }
}
