module.exports = [
  {
    files: ['**/*.ts'],
    ignores: [
      '.eslintrc.js',
      'ormconfig.js',
      'redis.config.ts',
      'redisSingle.config.ts',
      'typeorm.config.ts',
      'webpack-hmr.config.js',
      'typeorm-transactional.ts',
      'jest.config.js',
      'release.config.js',
      'generate-migration.js',
    ],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      globals: {
        // 글로벌 변수를 정의하고 싶다면 여기에서 설정 가능
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.js'],
    ignores: ['.eslintrc.js', 'jest.config.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        // 여기에 node 및 jest 관련 글로벌 변수를 설정
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        jest: 'readonly',
      },
    },
  },
  {
    plugins: {
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
