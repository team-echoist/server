import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver';

// 타입 확인 필요
type VerifyCallback = (error: any, user?: any, info?: any) => void;

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor() {
    super({
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: process.env.NAVER_CLIENT_CALLBACK,
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
      platform: 'naver',
      platformId: id,
      email: _json.email,
      accessToken,
    };
    done(null, user);
  }
}
