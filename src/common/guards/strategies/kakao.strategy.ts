import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { Injectable } from '@nestjs/common';
import * as process from 'node:process';

type VerifyCallback = (error: any, user?: any, info?: any) => void;

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor() {
    super({
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: process.env.KAKAO_CLIENT_CALLBACK,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, _json } = profile;
    const user = {
      platform: 'kakao',
      platformId: id,
      email: _json.kakao_account.email,
      accessToken,
    };
    done(null, user);
  }
}
