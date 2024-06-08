import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './typeorm.config';

const initializeDataSource = async () => {
  const options = await dataSourceOptions();
  const dataSource = new DataSource(options);
  await dataSource.initialize();
  return dataSource;
};

export default initializeDataSource();
