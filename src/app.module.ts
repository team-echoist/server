import { Module } from '@nestjs/common';
import { typeOrmConfig } from '../typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtInterceptor } from './common/interceptros/Jwt.interceptor';

@Module({
  imports: [AuthModule, TypeOrmModule.forRoot(typeOrmConfig)],
  providers: [{ provide: APP_INTERCEPTOR, useClass: JwtInterceptor }],
})
export class AppModule {}
