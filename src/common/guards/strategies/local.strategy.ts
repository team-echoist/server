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

    if (!user)
      throw new HttpException('이메일 또는 비밀번호가 잘못되었습니다.', HttpStatus.UNAUTHORIZED);

    if (user.status === UserStatus.BANNED) {
      throw new HttpException(
        '정지된 계정입니다. 자세한 내용은 지원팀에 문의하세요.',
        HttpStatus.FORBIDDEN,
      );
    }

    return user;
  }
}
