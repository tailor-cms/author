// Vite's `hmr update` line prints every affected module's full id;
// absolute path, `?macro=true` query variants, and URL-encoded
// `/@id/virtual:...` ids for Nuxt-generated files (e.g. the route
// manifest); which drowns out the one thing worth scanning at a glance:
// which page/component just reloaded. This shortens each id to its last
// two path segments (e.g. `settings/general.vue`) and dedupes across
// query variants of the same file.
const ESC = String.fromCharCode(27);
const ANSI = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');
const DIM_START = `${ESC}[2m`;
const DIM_END = `${ESC}[22m`;

const shortenModuleId = (id: string): string => {
  const withoutQuery = id.split('?')[0]!;
  const decoded = withoutQuery.startsWith('/@id/virtual:')
    ? decodeURIComponent(withoutQuery)
    : withoutQuery;
  return decoded.split('/').filter(Boolean).slice(-2).join('/');
};

const compact = (msg: string): string => {
  const plain = msg.replace(ANSI, '');
  const [, list] = plain.match(/^hmr update\s+(.+)$/) || [];
  if (!list) return msg;
  const names = [...new Set(list.split(', ').map(shortenModuleId))].join(', ');
  // Colour is on: keep the green `hmr update ` prefix as-is and swap in
  // the shortened, still-dimmed list. No colour (NO_COLOR/CI): plain text.
  const dimStart = msg.indexOf(DIM_START);
  if (dimStart === -1) return `hmr update ${names}`;
  return `${msg.slice(0, dimStart + DIM_START.length)}${names}${DIM_END}`;
};

interface ViteLoggerConfig {
  customLogger?: {
    info: (msg: string, opts?: unknown) => void;
  };
}

/**
 * `vite:extendConfig` hook;  wraps the `customLogger` Nuxt just attached
 * to the resolved Vite config, so the shortened output still goes through
 * Nuxt's own formatting (dedup / `(xN)` collapsing / colour / DEBUG
 * passthrough) instead of bypassing it.
 */
export default function compactHmrLog(config: ViteLoggerConfig) {
  const logger = config.customLogger;
  if (!logger) return;
  const info = logger.info.bind(logger);
  logger.info = (msg: string, opts?: unknown) => info(compact(msg), opts);
}
