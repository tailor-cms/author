import camelCase from 'lodash/camelCase.js';

// Plugin-supplied env vars are passed through under a `TCE_*` prefix.
// Each is exposed as a camelCased key on the plugin config bag handed
// to content-element hooks + procedures (see elementRegistry).
const PREFIX = 'TCE_';

const tceConfig: Record<string, string | undefined> = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key]) => key.startsWith(PREFIX))
    .map(([key, value]) => [camelCase(key.slice(PREFIX.length)), value]),
);

export default tceConfig;
