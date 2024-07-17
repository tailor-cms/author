// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  debug: true,
  modules: ['@nuxtjs/google-fonts', '@pinia/nuxt'],
  build: {
    transpile: ['vuetify'],
  },
  devtools: { enabled: true },
  telemetry: false,
  devServer: {
    port: parseInt(process.env.REVERSE_PROXY_PORT as string, 10),
  },
  routeRules: {
    '/api/**': {
      proxy: `http://localhost:${process.env.BACKEND_PORT}/api/**`,
    },
    '/repository/assets/**': {
      proxy: `http://localhost:${process.env.BACKEND_PORT}/repository/assets/**`,
    },
  },
  css: [
    '@mdi/font/css/materialdesignicons.min.css',
    'vuetify/lib/styles/main.sass',
  ],
  pinia: {
    storesDirs: ['./stores/**'],
  },
  googleFonts: {
    families: {
      Roboto: true,
      Poppins: true,
    },
  },
  runtimeConfig: {
    public: {
      aiUiEnabled: false,
      oidcEnabled: false,
      oidcLogoutEnabled: false,
    },
  },
});
