// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  devServer: {
    // TODO: Baked in until frontend is migrated to Nuxt
    port: 8081,
  },
  build: {
    transpile: ['vuetify'],
  },
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css',
  ],
});
