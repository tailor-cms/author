// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  devServer: {
    // TODO: Baked in until frontend is migrated to Nuxt
    port: 8081,
  },
  css: ['vuetify/lib/styles/main.sass'],
  build: {
    transpile: ['vuetify'],
  },
});
