import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { UserRepository } from './user.repository';
import { LocalStrategy } from '../../common/guards/local.strategy';
import * as dotenv from 'dotenv';
import { AuthService } from '../auth/auth.service';

dotenv.config();
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30m' },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [UserService, LocalStrategy, UserRepository, AuthService],
})
export class UserModule {}
