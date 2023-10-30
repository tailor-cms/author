export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'es',
    inlineDynamicImports: true,
  },
  external: ['@tailor-cms/config'],
};
