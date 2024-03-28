import { Logger, Module } from '@nestjs/common';
import { typeOrmConfig } from '../typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [UserModule, TypeOrmModule.forRoot(typeOrmConfig)],
  providers: [Logger],
})
export class AppModule {}
