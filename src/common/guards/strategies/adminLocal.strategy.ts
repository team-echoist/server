import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AdminService } from '../../../modules/admin/core/admin.service';

@Injectable()
export class AdminLocalStrategy extends PassportStrategy(Strategy, 'admin-local') {
  constructor(private adminService: AdminService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string) {
    const admin = await this.adminService.validateAdmin(email, password);
    if (!admin) {
      throw new UnauthorizedException('이메일 혹은 비밀번호가 잘못되었습니다.');
    }
    if (!admin.activated) {
      throw new HttpException(
        '계정이 활성화 상태가 아닙니다. 관리자에게 문의하세요.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return admin;
  }
}
