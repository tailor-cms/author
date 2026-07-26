import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['*.ts', '!tsdown.config.ts'],
  format: ['esm', 'cjs'],
  platform: 'node',
  target: 'node20',
  unbundle: true,
  dts: true,
  clean: true,
  outExtensions: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
});
