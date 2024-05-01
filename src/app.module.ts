import { redisConfig } from '../redis.config';
import { typeOrmConfig } from '../typeorm.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module, OnModuleInit } from '@nestjs/common';
import { JwtInterceptor } from './common/interceptros/jwt.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AuthModule } from './modules/auth/auth.module';
import { EssayModule } from './modules/essay/essay.module';
import { MailModule } from './modules/mail/mail.module';
import { DeviceInterceptor } from './common/interceptros/device.interceptor';
import { SeederService } from './modules/seeder/seeder.service';
import { SeederModule } from './modules/seeder/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    RedisModule.forRootAsync({
      useFactory: () => redisConfig,
    }),
    SeederModule,
    AuthModule,
    EssayModule,
    MailModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: DeviceInterceptor },
    { provide: APP_INTERCEPTOR, useClass: JwtInterceptor },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seederService: SeederService) {}

  async onModuleInit() {
    if (process.env.SEED_DB === 'true') {
      await this.seederService.seed();
    }
  }
}
