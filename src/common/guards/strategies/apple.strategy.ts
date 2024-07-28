import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, Profile } from '@arendajaelu/nestjs-passport-apple';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor() {
    super({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      callbackURL: process.env.APPLE_CALLBACK_URL,
      keyID: process.env.APPLE_KEY_ID,
      key: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/'/g, ''),
      scope: ['name', 'email'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const user = {
      email: profile.email ? profile.email : null,
      platformId: profile.id,
      platform: 'apple',
    };
    return user;
  }
}
