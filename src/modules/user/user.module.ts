import * as strategies from '../../common/guards/strategies';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { AwsModule } from '../aws/aws.module';
import { EssayModule } from '../essay/essay.module';
import { UtilsModule } from '../utils/utils.module';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import { Essay } from '../../entities/essay.entity';
import { NicknameModule } from '../nickname/nickname.module';
import { DeactivationReason } from '../../entities/deactivationReason.entity';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { UserProcessor } from './user.processor';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    TypeOrmModule.forFeature([User, Essay, DeactivationReason]),
    BullModule.registerQueueAsync({
      name: 'user',
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
        prefix: '{bull}',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    MailModule,
    AwsModule,
    UtilsModule,
    NicknameModule,
    forwardRef(() => EssayModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, UserProcessor, strategies.JwtStrategy],
  exports: [UserService, UserRepository],
})
export class UserModule {}
