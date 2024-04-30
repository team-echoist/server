import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './src/entities/user.entity';
import { Receipt } from 'src/entities/receipt.entity';
import { Essay } from './src/entities/essay.entity';
import { Category } from './src/entities/category.entity';
import * as dotenv from 'dotenv';
import { ProcessingHistory } from './src/entities/processingHistory.entity';
import { ReviewQueue } from './src/entities/reviewQueue.entity';
import { ReportQueue } from './src/entities/reportQueue.entity';

dotenv.config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  entities: [User, Essay, Receipt, Category, ReportQueue, ReviewQueue, ProcessingHistory],
  synchronize: true,
  migrations: ['dist/migration/*.js'],
  migrationsTableName: 'migrations',
  logging: false,
  extra: {
    max: 9,
    connectionTimeoutMillis: 5000,
  },
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
};
