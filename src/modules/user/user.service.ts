import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { User } from '../../entities/user.entity';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { UserResDto } from './dto/userRes.dto';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserReqDto): Promise<UserResDto> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);

    return await this.userRepository.createUser(createUserDto);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findByEmail(email);
    if (user && user.password === password) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
