module.exports = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ...require('./typeorm.config').typeOrmConfig,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migration/*.js'],
  cli: {
    migrationsDir: 'src/migration',
  },
};
