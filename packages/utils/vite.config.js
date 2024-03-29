import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  build: {
    lib: {
      entry: path.join(_dirname, './src/index.js'),
      name: 'TailorUtils',
      formats: ['es', 'cjs', 'umd']
    }
  }
};

export default () => defineConfig(config);
