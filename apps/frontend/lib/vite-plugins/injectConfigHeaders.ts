const configCookie = JSON.stringify(
  Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith('NUXT')),
  ),
);

export default {
  name: 'inject-confi-headers',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.originalUrl === '/_nuxt/app.vue') {
        res.setHeader('Set-Cookie', `config=${configCookie}; path=/`);
      }
      next();
    });
  },
};
