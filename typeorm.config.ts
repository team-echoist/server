import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER_NAME,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  entities: [],
  synchronize: true,
  migrations: ['dist/migration/*.js'],
  migrationsTableName: 'migrations',
  extra: {
    max: 9,
    connectionTimeoutMillis: 5000,
  },
};
