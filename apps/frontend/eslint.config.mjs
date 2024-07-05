import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['**/dist', '**/.nuxt', '**/node_modules'],
  },
  ...compat.extends(
    '@tailor-cms/eslint-config',
    '@nuxt/eslint-config',
    'prettier',
  ),
  {
    languageOptions: {
      globals: {
        useCookie: true,
        navigateTo: true,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        tsconfigRootDir: __dirname,
        parser: '@typescript-eslint/parser',
      },
    },
    rules: {
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array-simple',
        },
      ],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/no-undef-components': [
        'error',
        {
          ignorePatterns: ['Nuxt*', 'V[A-Z]*'],
        },
      ],
    },
  },
  {
    files: ['layouts/*.vue', 'pages/**/*.vue', '**/error.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  },
];
