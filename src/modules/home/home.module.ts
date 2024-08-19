import { forwardRef, Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { HomeRepository } from './home.repository';
import { GeulroquisModule } from '../geulroquis/geulroquis.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule.register({}),
    GeulroquisModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
  ],
  controllers: [HomeController],
  providers: [HomeService, HomeRepository],
  exports: [HomeService],
})
export class HomeModule {}
