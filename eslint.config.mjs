import js from '@eslint/js';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

const testGlobals = {
  afterEach: 'readonly',
  beforeEach: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  it: 'readonly',
  jasmine: 'readonly',
  jest: 'readonly',
};

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.angular/**'],
  },
  {
    files: ['backend/src/**/*.ts', 'backend/test/**/*.ts', 'frontend/src/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['backend/test/**/*.ts', 'frontend/src/**/*.spec.ts'],
    languageOptions: {
      globals: testGlobals,
    },
  },
  {
    files: ['frontend/src/**/*.ts'],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
  },
  {
    files: ['frontend/src/**/*.html'],
    extends: [...angular.configs.templateRecommended],
  },
);
