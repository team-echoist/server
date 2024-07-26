import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-apple';

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

  //   const { id, emails } = profile;
  // const user = {
  //   platform: 'google',
  //   platformId: id,
  //   email: emails[0].value,
  //   accessToken,
  // };

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id } = profile;
      const user = {
        platform: 'apple',
        platformId: id,
      };
      done(null, user);
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}
