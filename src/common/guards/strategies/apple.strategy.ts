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
    id_token: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      console.log('id_token: ', id_token);

      const appleKeys = await axios.get('https://appleid.apple.com/auth/keys');
      const keys = appleKeys.data.keys;
      const publicKey = keys[0];

      const decodedIdToken = jwt.verify(id_token, publicKey, { algorithms: ['RS256'] });
      console.log('첫 번째 공개키로 디코딩한것: ', decodedIdToken);
      console.log('디코딩된것 sub: ', decodedIdToken.sub);

      const user = {
        platform: 'apple',
        platformId: decodedIdToken.sub,
        email: decodedIdToken || null,
      };
      done(null, user);
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}
