import typescriptEslint from '@typescript-eslint/eslint-plugin';
import parser from 'vue-eslint-parser';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
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
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/build',
      'apps/frontend/src/components.d.ts',
    ],
  },
  ...compat.extends('@tailor-cms/eslint-config'),
  {
    files: ['**/*.js', '**/*.ts', '**/*.vue'],
    plugins: { typescriptEslint },
    languageOptions: {
      parser,
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
        extraFileExtensions: ['.vue'],
      },
    },
  },
];
