import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import * as strategies from '../../common/guards/strategies';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, UserRepository, strategies.JwtStrategy],
  exports: [UserService, UserRepository],
})
export class UserModule {}
