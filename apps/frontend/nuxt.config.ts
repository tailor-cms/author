const configCookie = JSON.stringify(
  Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith('NUXT')),
  ),
);

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  debug: true,
  modules: ['@nuxtjs/google-fonts', '@pinia/nuxt'],
  build: {
    transpile: ['vuetify'],
  },
  vite: {
    optimizeDeps: { include: ['lodash'] },
    plugins: [
      {
        name: 'inject-configuration-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.originalUrl === '/_nuxt/app.vue') {
              res.setHeader('Set-Cookie', `config=${configCookie}; path=/`);
            }
            next();
          });
        },
      },
    ],
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
      availableSchemas: '',
    },
  },
});
