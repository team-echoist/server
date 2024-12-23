import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as dotenv from 'dotenv';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AdminService } from '../../../modules/base/admin/core/admin.service';

dotenv.config();

@Injectable()
export class AdminPassStrategy extends PassportStrategy(Strategy, 'admin-pass') {
  constructor(private readonly adminService: AdminService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: any) {
    return await this.adminService.validatePayload(payload.sub);
  }
}
