import { forwardRef, Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { HomeRepository } from './home.repository';
import { GeulroquisModule } from '../geulroquis/geulroquis.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from '../../entities/item.entity';
import { Theme } from '../../entities/theme.entity';
import { UserTheme } from '../../entities/userTheme.entity';
import { UtilsModule } from '../utils/utils.module';
import { UserItem } from '../../entities/userItem.entity';
import { UserHomeLayout } from '../../entities/userHomeLayout.entity';
import { UserHomeItem } from '../../entities/userHomeItem.entity';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Item, Theme, UserTheme, UserItem, UserHomeLayout, UserHomeItem]),
    GeulroquisModule,
    UtilsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
  ],
  controllers: [HomeController],
  providers: [HomeService, HomeRepository],
  exports: [HomeService],
})
export class HomeModule {}
