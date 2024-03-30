import { Module } from '@nestjs/common';
import { typeOrmConfig } from '../typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forRoot(typeOrmConfig)],
  providers: [],
})
export class AppModule {}
