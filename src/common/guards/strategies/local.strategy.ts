import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../../modules/auth/auth.service';
import { UserStatus } from '../../../entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new HttpException('Invalid email or password.', HttpStatus.UNAUTHORIZED);
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
