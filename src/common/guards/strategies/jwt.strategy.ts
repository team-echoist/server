import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../../modules/auth/auth.service';
import * as dotenv from 'dotenv';
import { UserStatus } from '../../../entities/user.entity';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly jwtService: JwtService,
    private authService: AuthService,
  ) {
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
        'Your account has been banned. Please contact support for more information.',
        HttpStatus.FORBIDDEN,
      );
    }

    return user;
  }
}
