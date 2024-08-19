import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as dotenv from 'dotenv';
import { AdminService } from '../../../modules/admin/admin.service';

dotenv.config();

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private readonly adminService: AdminService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: any) {
    const admin = await this.adminService.validatePayload(payload.id);
    if (!admin) {
      throw new UnauthorizedException();
    }
    if (!admin.activated) {
      throw new UnauthorizedException('Admin account is not activated');
    }

    return admin;
  }
}
