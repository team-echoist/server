import { Module } from '@nestjs/common';
import { typeOrmConfig } from '../typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtInterceptor } from './common/interceptros/Jwt.interceptor';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forRoot(typeOrmConfig)],
  providers: [{ provide: APP_INTERCEPTOR, useClass: JwtInterceptor }],
})
export class AppModule {}
