import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AdminService } from '../../../modules/admin/admin.service';

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
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!admin.activated) {
      throw new HttpException('Your account has not been activated.', HttpStatus.UNAUTHORIZED);
    }
    return admin;
  }
}

// if (!user) {
//       throw new HttpException('Invalid email or password.', HttpStatus.UNAUTHORIZED);
//     }
//     if (user.status === UserStatus.BANNED) {
//       throw new HttpException(
//         'Your account has been banned. Please contact support for more information.',
//         HttpStatus.UNAUTHORIZED,
//       );
//     }
//     return user;
