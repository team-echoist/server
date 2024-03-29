import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserReqDto } from './dto/createUserReq.dto';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { UserResDto } from './dto/userRes.dto';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

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
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }
}
