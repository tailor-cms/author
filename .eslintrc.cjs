module.exports = {
  root: true,
  extends: ['@tailor-cms/eslint-config'],
  plugins: ['@typescript-eslint'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
    extraFileExtensions: ['.vue'],
  },
};
