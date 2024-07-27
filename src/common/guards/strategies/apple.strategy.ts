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
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const decodedProfile = jwt.decode(profile) as any;

      console.log('Decoded Profile:', decodedProfile);

      const { sub: id, email } = decodedProfile;

      const user = {
        platform: 'apple',
        platformId: id,
        email: email || null,
      };
      done(null, user);
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}
