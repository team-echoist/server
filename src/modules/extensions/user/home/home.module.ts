import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HomeController } from './api/home.controller';
import { HomeService } from './core/home.service';
import { HomeRepository } from './infrastructure/home.repository';
import { RedlockProvider } from '../../../../config/redlock.provider';
import { Item } from '../../../../entities/item.entity';
import { Theme } from '../../../../entities/theme.entity';
import { UserHomeItem } from '../../../../entities/userHomeItem.entity';
import { UserHomeLayout } from '../../../../entities/userHomeLayout.entity';
import { UserItem } from '../../../../entities/userItem.entity';
import { UserTheme } from '../../../../entities/userTheme.entity';
import { AuthModule } from '../../../base/auth/auth.module';
import { UserModule } from '../../../base/user/user.module';
import { ToolModule } from '../../../utils/tool/tool.module';
import { GeulroquisModule } from '../../essay/geulroquis/geulroquis.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([Item, Theme, UserTheme, UserItem, UserHomeLayout, UserHomeItem]),
    GeulroquisModule,
    ToolModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
  ],
  controllers: [HomeController],
  providers: [
    HomeService,
    { provide: 'IHomeRepository', useClass: HomeRepository },
    RedlockProvider,
  ],
  exports: [HomeService],
})
export class HomeModule {}
