import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';
import { Essay } from '../entities/essay.entity';
import { Subscription } from '../entities/subscription.entity';
import { Story } from '../entities/story.entity';
import { ReportQueue } from '../entities/reportQueue.entity';
import { ReviewQueue } from '../entities/reviewQueue.entity';
import { Tag } from '../entities/tag.entity';
import { Follow } from '../entities/follow.entity';
import { Badge } from '../entities/badge.entity';
import { TagExp } from '../entities/tagExp.entity';
import { ViewRecord } from '../entities/viewRecord.entity';

dotenv.config();

export const TypeormOptionsConfig: TypeOrmModuleAsyncOptions = {
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
    synchronize: true,
    autoLoadEntities: true,
    timezone: 'Asia/Seoul',
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
