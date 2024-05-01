import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './src/entities/user.entity';
import { Essay } from './src/entities/essay.entity';
import { Receipt } from './src/entities/receipt.entity';
import { Category } from './src/entities/category.entity';
import { ReportQueue } from './src/entities/reportQueue.entity';
import { ReviewQueue } from './src/entities/reviewQueue.entity';
import { ProcessingHistory } from './src/entities/processingHistory.entity';

dotenv.config();

export const TypeOrmOptions: TypeOrmModuleAsyncOptions = {
  useFactory: () => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
    entities: [User, Essay, Receipt, Category, ReportQueue, ReviewQueue, ProcessingHistory],
    dropSchema: process.env.ENV === 'prod',
    synchronize: true,
    autoLoadEntities: true,
    migrations: ['dist/migration/*.js'],
    migrationsTableName: 'migrations',
    logging: false,
    extra: {
      max: 9,
      connectionTimeoutMillis: 5000,
    },
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  }),
  async dataSourceFactory(option) {
    if (!option) throw new Error('Invalid options passed');

    return addTransactionalDataSource(new DataSource(option));
  },
};
