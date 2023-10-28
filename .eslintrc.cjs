module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: ['@tailor-cms/eslint-config'],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
    extraFileExtensions: ['.vue'],
  },
};
