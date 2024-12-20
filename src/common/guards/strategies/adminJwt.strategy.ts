import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as dotenv from 'dotenv';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AdminService } from '../../../modules/base/admin/core/admin.service';

dotenv.config();

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    configService: ConfigService,
    private readonly adminService: AdminService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    const admin = await this.adminService.validatePayload(payload.sub);
    if (!admin) {
      throw new UnauthorizedException();
    }
    if (!admin.activated) {
      throw new UnauthorizedException('비활성화 상태.');
    }

    return admin;
  }
}
