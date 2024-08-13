import { DataSource } from 'typeorm';
import 'dotenv/config';

export const dataSourceCli = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../entities/*.entity.ts'],
  migrations: [__dirname + '/../migrations/**/*.{js,ts}'],
  synchronize: false,
  logging: false,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
