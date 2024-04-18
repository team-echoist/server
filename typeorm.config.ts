import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './src/entities/user.entity';
import { Subscription } from 'src/entities/subscription.entity';
import { Essay } from './src/entities/essay.entity';
import * as dotenv from 'dotenv';

dotenv.config();
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  entities: [User, Essay, Subscription],
  synchronize: true,
  migrations: ['dist/migration/*.js'],
  migrationsTableName: 'migrations',
  logging: true,
  extra: {
    max: 9,
    connectionTimeoutMillis: 5000,
  },
  ssl: {
    rejectUnauthorized: false,
  },
};
