import { brandConfig, brandStyles } from './config/client/brand.loader.js';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import Components from 'unplugin-vue-components/vite';
import htmlReplace from './build/plugins/vite/html-replace.js';
import path from 'node:path';
import resolveUrl from 'tailor-config-shared/src/url.js';
import vue from '@vitejs/plugin-vue2';
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import yn from 'yn';

const _dirname = fileURLToPath(new URL('.', import.meta.url));

const getDefine = env => ({
  'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
  'process.env.API_PATH': JSON.stringify('/api'),
  'process.env.ENABLE_DEFAULT_SCHEMA': yn(env.ENABLE_DEFAULT_SCHEMA),
  'process.env.OIDC_ENABLED': yn(env.OIDC_ENABLED),
  'process.env.OIDC_LOGOUT_ENABLED': yn(env.OIDC_LOGOUT_ENABLED),
  'process.env.OIDC_LOGIN_TEXT': JSON.stringify(env.OIDC_LOGIN_TEXT),
  'BRAND_CONFIG.TITLE': JSON.stringify(brandConfig.title),
  'BRAND_CONFIG.FAVICON': JSON.stringify(brandConfig.favicon),
  'BRAND_CONFIG.LOGO_COMPACT': JSON.stringify(brandConfig.logo.compact),
  'BRAND_CONFIG.LOGO_FULL': JSON.stringify(brandConfig.logo.full)
});

const getServer = env => {
  const { origin } = resolveUrl(env);
  return {
    host: env.HOSTNAME || '0.0.0.0',
    port: env.REVERSE_PROXY_PORT || 8080,
    fs: {
      allow: ['../../..']
    },
    hrm: true,
    proxy: {
      // Needs to exclude files from `cilent/api` folder, as they shouldn't be proxied
      // eslint-disable-next-line no-useless-escape
      '^\/api\/(?![A-Za-z]+\.js)': origin,
      '/proxy': origin,
      ...(env.STORAGE_PATH ? { '/repository': origin } : {})
    }
  }
};
const alias = [
  {
    find: '~',
    replacement: path.join(_dirname, 'node_modules')
  },
  {
    find: '@/',
    replacement: path.join(_dirname, 'src/')
  },
  {
    find: 'client/',
    replacement: path.join(_dirname, 'src/')
  },
  {
    find: 'components/',
    replacement: path.join(_dirname, 'src/components/')
  },
  {
    find: 'utils/',
    replacement: path.join(_dirname, 'src/utils/')
  },
  {
    find: 'assets/',
    replacement: path.join(_dirname, 'src/assets/')
  },
  {
    find: /^~.+/,
    replacement: val => val.replace(/^~/, '')
  }
];
const plugins = [
  vue(),
  Components({
    resolvers: [VuetifyResolver()]
  }),
  htmlReplace({
    defaults: true,
    replacements: { ...brandConfig }
  })
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  /**
   * @type {import('vite').UserConfig}
   */
  return {
    base: './',
    publicDir: 'assets/img',
    root: path.join(_dirname, 'src'),
    build: {
      outDir: '../dist'
    },
    resolve: {
      alias
    },
    define: getDefine(env),
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import '@/assets/stylesheets/common/_variables.scss';
            ${brandStyles}
          `
        }
      }
    },
    server: getServer(env),
    plugins
  };
});
