import camelCase from 'lodash/camelCase.js';

// Plugin-supplied env vars are passed through under a `TCE_*` prefix.
// The set is open: plugins ship their own vars, so unlike env.ts we
// can't pre-declare a schema. Each matching var is exposed as a
// camelCased key on the plugin config bag handed to content-element
// hooks + procedures (see elementRegistry.getHook / getProcedure).
const PREFIX = 'TCE_';

const tceConfig: Record<string, string | undefined> = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key]) => key.startsWith(PREFIX))
    .map(([key, value]) => [camelCase(key.slice(PREFIX.length)), value]),
);

export default tceConfig;
