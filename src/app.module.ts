import { redisConfig } from '../redis.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { EssayModule } from './modules/essay/essay.module';
import { AdminModule } from './modules/admin/admin.module';
import { MailModule } from './modules/mail/mail.module';
import { UtilsModule } from './modules/utils/utils.module';
import { TagModule } from './modules/tag/tag.module';
import { StoryModule } from './modules/story/story.module';
import { SeederModule } from './modules/seeder/seeder.module';
import { FollowModule } from './modules/follow/follow.module';
import { BadgeModule } from './modules/badge/badge.module';
import { AwsModule } from './modules/aws/aws.module';
import { ReviewModule } from './modules/review/review.module';
import { UserModule } from './modules/user/user.module';
import { ReportModule } from './modules/report/report.module';
import { SeederService } from './modules/seeder/seeder.service';
import { JwtInterceptor } from './common/interceptros/jwt.interceptor';
import { DeviceInterceptor } from './common/interceptros/device.interceptor';
import { TimezoneMiddleware } from './common/middlewares/timezone.middleware';
import { TypeOrmOptions } from '../typeorm.options';
import { ViewModule } from './modules/view/view.module';

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
    UserModule,
    SeederModule,
    AuthModule,
    EssayModule,
    ReportModule,
    ReviewModule,
    TagModule,
    FollowModule,
    StoryModule,
    MailModule,
    RedisModule,
    UtilsModule,
    AwsModule,
    BadgeModule,
    ViewModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: DeviceInterceptor },
    { provide: APP_INTERCEPTOR, useClass: JwtInterceptor },
  ],
})
export class AppModule implements OnModuleInit, NestModule {
  constructor(private readonly seederService: SeederService) {}

  async onModuleInit() {
    if (process.env.SEED_DB === 'true' && process.env.ENV === 'prod') {
      await this.seederService.seedAdmin();
      await this.seederService.seedAll();
    }
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TimezoneMiddleware).forRoutes('*');
  }
}
