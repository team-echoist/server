import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-apple';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor() {
    super({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      callbackURL: process.env.APPLE_CALLBACK_URL,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/'/g, ''),
      scope: ['name', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const appleKeys = await axios.get('https://appleid.apple.com/auth/keys');
      const keys = appleKeys.data.keys;
      const publicKey = keys[0];

      console.log('애플키를 검증해봅시다');
      console.log('애플 공개키: ', appleKeys);
      console.log('애플 공개키들: ', keys);
      console.log('애플 공개키들 중 첫번째: ', publicKey);

      // 공개 키를 사용하여 ID 토큰 디코딩 및 검증
      const decodedIdToken = jwt.verify(idToken, publicKey, { algorithms: ['RS256'] });
      console.log('첫 번째 공개키로 디코딩한것', decodedIdToken);

      const user = {
        platform: 'apple',
        platformId: decodedIdToken.sub,
        email: profile.email || null,
      };
      done(null, user);
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}
