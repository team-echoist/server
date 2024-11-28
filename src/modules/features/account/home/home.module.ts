import { forwardRef, Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { HomeRepository } from './home.repository';
import { GeulroquisModule } from '../../content/geulroquis/geulroquis.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../../base/auth/auth.module';
import { UserModule } from '../../../base/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from '../../../../entities/item.entity';
import { Theme } from '../../../../entities/theme.entity';
import { UserTheme } from '../../../../entities/userTheme.entity';
import { ToolModule } from '../../../utils/tool/tool.module';
import { UserItem } from '../../../../entities/userItem.entity';
import { UserHomeLayout } from '../../../../entities/userHomeLayout.entity';
import { UserHomeItem } from '../../../../entities/userHomeItem.entity';
import { RedlockProvider } from '../../../../config/redlock.provider';
import { ConfigModule } from '@nestjs/config';

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
  providers: [HomeService, HomeRepository, RedlockProvider],
  exports: [HomeService],
})
export class HomeModule {}
