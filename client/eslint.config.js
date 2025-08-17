import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import * as tseslint from 'typescript-eslint';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import react from 'eslint-plugin-react';

export default tseslint.config(
  { ignores: ['dist', '**/.vite/**'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
      react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'quotes': ['error', 'single', { avoidEscape: true }],
      'jsx-quotes': ['error', 'prefer-single'],
      'indent': ['error', 2],
      'padding-line-between-statements': [
        'error',
        { 'blankLine': 'always', 'prev': 'block-like', 'next': 'block-like' }
      ],
      'no-multiple-empty-lines': ['error', { 'max': 1 }],
      'eol-last': ['error', 'always'],
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react', '^@?\\w'],
            ['^@'],
            ['^\\.'],
          ],
        },
      ],
      'sort-keys': ['error', 'asc', { 'caseSensitive': false, 'natural': true }],
      'react/jsx-sort-props': ['error', { 'ignoreCase': true }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
