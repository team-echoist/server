import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../../modules/auth/auth.service';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class AdminStrategy extends PassportStrategy(Strategy) {
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
    const user = await this.authService.validatePayload(payload.email);
    if (!user || user.role !== 'admin') {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }
}
