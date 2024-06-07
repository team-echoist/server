import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './src/entities/user.entity';
import { Essay } from './src/entities/essay.entity';
import { Subscription } from './src/entities/subscription.entity';
import { Story } from './src/entities/story.entity';
import { ReportQueue } from './src/entities/reportQueue.entity';
import { ReviewQueue } from './src/entities/reviewQueue.entity';
import { Tag } from './src/entities/tag.entity';
import { Follow } from './src/entities/follow.entity';
import { Badge } from './src/entities/badge.entity';
import { TagExp } from './src/entities/tagExp.entity';
import { ViewRecord } from './src/entities/viewRecord.entity';

dotenv.config();

export const TypeOrmOptions: TypeOrmModuleAsyncOptions = {
  useFactory: () => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
    entities: [
      User,
      Essay,
      Subscription,
      Story,
      ReportQueue,
      ReviewQueue,
      Tag,
      Follow,
      Badge,
      TagExp,
      ViewRecord,
    ],
    dropSchema: process.env.ENV === 'prod',
    timezone: 'Asia/Seoul',
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

    if (!global.dataSource) {
      global.dataSource = new DataSource(option);
      await global.dataSource.initialize();
      addTransactionalDataSource(global.dataSource);
    }

    return global.dataSource;
  },
};
