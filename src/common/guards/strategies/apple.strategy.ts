import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-apple';
import * as jwt from 'jsonwebtoken';

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
    decodedIdToken: any,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      console.log('accessToken: ', accessToken);
      console.log('-----------------------------------');
      console.log('-----------------------------------');
      console.log('refreshToken: ', refreshToken);
      console.log('-----------------------------------');
      console.log('-----------------------------------');
      console.log('decodedIdToken: ', decodedIdToken);
      console.log('-----------------------------------');
      console.log('-----------------------------------');
      console.log('profile: ', profile);
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
