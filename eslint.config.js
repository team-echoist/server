const { configs } = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

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
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': configs.recommended,
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
      import: require('eslint-plugin-import'),
    },
    rules: {
      'prettier/prettier': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
];
