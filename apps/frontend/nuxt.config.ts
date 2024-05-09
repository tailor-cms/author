// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  debug: true,
  modules: ['@nuxtjs/google-fonts', '@pinia/nuxt'],
  build: {
    transpile: ['vuetify'],
  },
  devtools: { enabled: true },
  devServer: {
    // TODO: Baked in until frontend is migrated to Nuxt
    port: 8080,
  },
  routeRules: {
    '/api/**': {
      proxy: 'http://localhost:3000/api/**',
    },
    '/repository/assets/**': {
      proxy: 'http://localhost:3000/repository/assets/**',
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
    },
  },
});
