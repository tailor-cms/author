import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['*.ts', '!tsdown.config.ts'],
  target: 'node26',
  unbundle: true,
  dts: true,
  fixedExtension: false,
});
