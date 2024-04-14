import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../../modules/auth/auth.service';

/**
 * @title 로컬 전략
 * @description
 * 사용자 인증 성공 후 요청 객체에 추가된 user 프로퍼티는 요청의 생명주기가 끝날 때 까지 유효합니다.
 * 즉, nestjs에서 요청 생명주기의 끝인 filter까지 살아있습니다. (filter에서도 req.user에 접근 가능)
 * */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
