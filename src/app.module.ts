import { redisConfig } from '../redis.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { EssayModule } from './modules/essay/essay.module';
import { AdminModule } from './modules/admin/admin.module';
import { MailModule } from './modules/mail/mail.module';
import { SeederModule } from './modules/seeder/seeder.module';
import { SeederService } from './modules/seeder/seeder.service';
import { JwtInterceptor } from './common/interceptros/jwt.interceptor';
import { DeviceInterceptor } from './common/interceptros/device.interceptor';
import { TypeOrmOptions } from '../typeorm.options';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync(TypeOrmOptions),
    RedisModule.forRootAsync({
      useFactory: () => redisConfig,
    }),
    AdminModule,
    SeederModule,
    AuthModule,
    EssayModule,
    MailModule,
    RedisModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: DeviceInterceptor },
    { provide: APP_INTERCEPTOR, useClass: JwtInterceptor },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seederService: SeederService) {}

  async onModuleInit() {
    if (process.env.SEED_DB === 'true' && process.env.ENV === 'prod') {
      await this.seederService.seed();
    }
  }
}
