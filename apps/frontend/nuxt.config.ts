import injectConfigHeaders from './lib/vite-plugins/injectConfigHeaders';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/google-fonts', '@pinia/nuxt'],
  ssr: false,
  devtools: { enabled: true },
  css: [
    '@mdi/font/css/materialdesignicons.min.css',
    'vuetify/lib/styles/main.sass',
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
    optimizeDeps: { include: ['lodash'] },
    plugins: [injectConfigHeaders()],
    css: {
      preprocessorOptions: {
        sass: {
          api: 'modern-compiler',
        },
      },
    },
  },
  telemetry: false,
  debug: true,
  googleFonts: {
    families: {
      Roboto: true,
      Poppins: true,
    },
  },
  pinia: {
    storesDirs: ['./stores/**'],
  },
});
