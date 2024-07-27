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
    req: any,
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const code = req.body.code;

      const tokenResponse = await axios.post('https://appleid.apple.com/auth/token', null, {
        params: {
          grant_type: 'authorization_code',
          code: code,
          client_id: process.env.APPLE_CLIENT_ID,
          client_secret: this.createClientSecret(),
        },
      });

      const idTokenDecoded = jwt.decode(tokenResponse.data.id_token) as any;
      console.log('Decoded ID Token:', idTokenDecoded);

      if (!idTokenDecoded) {
        throw new UnauthorizedException('Invalid idToken');
      }

      const { sub: id, email } = idTokenDecoded;
      if (!id) {
        throw new UnauthorizedException('No user ID returned from Apple');
      }

      console.log('흐엥: ', id, email);

      const user = {
        platform: 'apple',
        platformId: id,
        email: email || '',
      };

      done(null, user);
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  private createClientSecret() {
    const claims = {
      iss: process.env.APPLE_TEAM_ID,
      aud: 'https://appleid.apple.com',
      sub: process.env.APPLE_CLIENT_ID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    return jwt.sign(claims, process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'), {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: process.env.APPLE_KEY_ID,
      },
    });
  }
}
