const configCookie = JSON.stringify(
  Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      key.startsWith('NUXT_PUBLIC_'),
    ),
  ),
);

export default () => ({
  name: 'inject-config-headers',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.originalUrl === '/_nuxt/app.vue') {
        res.setHeader('Set-Cookie', `config=${configCookie}; path=/`);
      }
      next();
    });
  },
});
