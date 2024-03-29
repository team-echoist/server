import { Module } from '@nestjs/common';
import { typeOrmConfig } from '../typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthService } from './modules/auth/auth.service';

@Module({
  imports: [UserModule, TypeOrmModule.forRoot(typeOrmConfig)],
  providers: [AuthService],
})
export class AppModule {}
