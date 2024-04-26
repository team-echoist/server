import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { EssayController } from './essay.controller';
import { EssayService } from './essay.service';
import { EssayRepository } from './essay.repository';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { AuthService } from '../auth/auth.service';
import { AuthRepository } from '../auth/auth.repository';
import { JwtModule } from '@nestjs/jwt';
import * as strategies from '../../common/guards/strategies';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30h' },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User, Essay]),
  ],
  controllers: [EssayController],
  providers: [AuthService, AuthRepository, EssayService, EssayRepository, strategies.JwtStrategy],
})
export class EssayModule {}
