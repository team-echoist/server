import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { AuthRepository } from './auth.repository';
import { UserResDto } from './dto/userRes.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  generateJWT(user: Express.User | UserResDto): string {
    const secretKey = process.env.JWT_SECRET;
    const options = { expiresIn: '30m' };

    return jwt.sign({ email: user.email, id: user.id }, secretKey, options);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.authRepository.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async register(createUserDto: CreateUserReqDto): Promise<UserResDto> {
    const existingUser = await this.authRepository.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);

    return await this.authRepository.createUser(createUserDto);
  }

  async oauthLogin(user: any) {
    let existingUser: UserResDto = await this.authRepository.findByEmail(user.email);

    if (!existingUser) {
      existingUser = await this.authRepository.createUser({
        email: user.email,
        oauthInfo: { [`${user.platform}Id`]: user.platformId },
      });
    } else {
      if (!existingUser.oauthInfo || !existingUser.oauthInfo[`${user.platform}Id`]) {
        await this.authRepository.updateUserOauthInfo(existingUser.id, {
          [`${user.platform}Id`]: user.platformId,
        });
      }
    }
    return this.generateJWT(existingUser);
  }
}
