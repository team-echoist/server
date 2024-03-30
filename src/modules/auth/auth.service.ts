import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { AuthRepository } from './auth.repository';
import * as bcrypt from 'bcrypt';
import { UserResDto } from './dto/userRes.dto';
import { User } from '../../entities/user.entity';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private authRepository: AuthRepository) {}

  generateJWT(user: UserResDto | User): string {
    const secretKey = process.env.JWT_SECRET;
    const options = { expiresIn: '30m' };

    return jwt.sign({ username: user.email, id: user.id }, secretKey, options);
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
}