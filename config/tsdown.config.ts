import { transform } from 'esbuild';
import { defineConfig } from 'tsdown';

const DECORATOR = /^\s*@[A-Z]\w*\(/m;

/**
 * Lowers the TC39 decorators collection schemas are authored with. oxc,
 * tsdown's transformer, only handles the legacy TypeScript flavour and
 * passes these through as-is, leaving `dist/` unparseable by Node. esbuild
 * lowers them for any target below `esnext`, so it runs over sources first.
 */
const downlevelDecorators = () => ({
  name: 'downlevel-decorators',
  async transform(code: string, id: string) {
    if (!id.endsWith('.ts') || !DECORATOR.test(code)) return null;
    const { code: js, map } = await transform(code, {
      loader: 'ts',
      target: 'es2022',
      sourcefile: id,
      sourcemap: true,
    });
    return { code: js, map };
  },
});

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'node',
  target: 'node24',
  dts: true,
  clean: true,
  plugins: [downlevelDecorators()],
  outExtensions: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
});
