import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config();
export const TypeormConfig: TypeOrmModuleAsyncOptions = {
  useFactory: () => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
    autoLoadEntities: true,
    timezone: 'Asia/Seoul',
    dropSchema: false,
    synchronize: true,
    migrationsRun: true,
    entities: [path.join(__dirname + '/../entities/*.entity.ts')],
    migrations: [path.join(__dirname + '/../migrations/**/*.{js,ts}')],
    cli: {
      migrationsDir: 'src/migrations',
    },
    extra: {
      max: 9,
      keepAlive: true,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    logging: false,
    logger: 'advanced-console',
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

export const dataSourceOptions = async () => {
  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
    entities: [__dirname + '/../entities/*.entity.ts'],
    migrations: [__dirname + '/../migrations/**/*.{js,ts}'],
    timezone: 'Asia/Seoul',
    logging: false,
    extra: {
      max: 9,
      connectionTimeoutMillis: 5000,
    },
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };
};

export const dataSourceFactory = async (): Promise<DataSource> => {
  const options = await dataSourceOptions();
  const dataSource = new DataSource(options);
  await dataSource.initialize();
  return dataSource;
};
