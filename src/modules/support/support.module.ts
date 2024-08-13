import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from '../../entities/notice.entity';
import { Inquiry } from '../../entities/inquiry.entity';
import { SupportRepository } from './support.repository';
import * as strategies from '../../common/guards/strategies';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { AuthModule } from '../auth/auth.module';
import { User } from '../../entities/user.entity';
import { UtilsModule } from '../utils/utils.module';
import { UserModule } from '../user/user.module';
import { Release } from '../../entities/release.entity';
import { AlertSettings } from '../../entities/alertSettings.entity';
import { Device } from '../../entities/device.entity';
import { AppVersions } from '../../entities/appVersions.entity';
import { SeenNotice } from '../../entities/seenNotice.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    TypeOrmModule.forFeature([
      User,
      Notice,
      Inquiry,
      Release,
      AlertSettings,
      Device,
      AppVersions,
      SeenNotice,
    ]),
    AuthModule,
    UtilsModule,
    UserModule,
  ],
  controllers: [SupportController],
  providers: [SupportService, SupportRepository, strategies.JwtStrategy],
  exports: [SupportService, SupportRepository],
})
export class SupportModule {}
