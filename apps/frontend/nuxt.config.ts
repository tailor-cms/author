import compactHmrLog from './app/lib/vite-plugins/compactHmrLog';
import injectConfigHeaders from './app/lib/vite-plugins/injectConfigHeaders';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/google-fonts', '@pinia/nuxt'],
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
  css: [
    '@mdi/font/css/materialdesignicons.min.css',
    'vuetify/styles',
    '~/assets/css/reset.scss',
  ],
  build: {
    transpile: ['vuetify'],
  },
  routeRules: {
    '/api/**': {
      proxy: `http://localhost:${process.env.BACKEND_PORT}/api/**`,
    },
    '/api/oidc/**': {
      redirect: {
        to: `http://localhost:${process.env.BACKEND_PORT}/api/oidc/**`,
        statusCode: 302,
      },
    },
    '/repository/assets/**': {
      proxy: `http://localhost:${process.env.BACKEND_PORT}/repository/assets/**`,
    },
  },
  devServer: {
    port: parseInt(process.env.REVERSE_PROXY_PORT as string, 10),
  },
  vite: {
    plugins: [injectConfigHeaders()],
    // This app aliases `typescript` to the TS6 bridge (see package.json), so
    // its peer set differs from every workspace package and pnpm installs a
    // second copy of each of these. Two copies never share
    // module state: a second vee-validate keeps its own rule registry and
    // ignores plugins/vee-validate.ts, and a second vue/pinia/vuetify breaks
    // provide/inject outright. Keep this list in sync with runtime libs that
    // both this app and packages/* import.
    resolve: {
      dedupe: [
        'vue',
        'pinia',
        'vuetify',
        'vee-validate',
        '@vueuse/core',
        'vuedraggable',
      ],
    },
  },
  telemetry: false,
  debug: false,
  hooks: {
    'vite:extendConfig': compactHmrLog,
  },
  googleFonts: {
    families: {
      Geist: [400, 500, 600, 700],
    },
  },
  pinia: {
    storesDirs: ['./stores/**'],
  },
});
