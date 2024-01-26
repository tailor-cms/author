module.exports = {
  root: true,
  parserOptions: {
    tsconfigRootDir: __dirname,
    ecmaVersion: 2022,
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
  },
  extends: [
    '@tailor-cms/eslint-config',
    '@nuxtjs/eslint-config-typescript',
    'prettier',
  ],
  overrides: [
    {
      files: '*.vue',
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
      files: ['layouts/*.vue', 'pages/**/*.vue', 'error.vue'],
      rules: { 'vue/multi-word-component-names': 'off' },
    },
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: { parser: '@typescript-eslint/parser' },
    },
  ],
};
