import { defineBuildConfig } from 'unbuild';

// Collection schemas use TC39 decorators; esbuild downlevels them for any
// target below `esnext`.
export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    esbuild: { target: 'node24' },
  },
});
