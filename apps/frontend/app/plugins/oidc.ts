import OidcClient from '@/lib/OidcClient';

export default defineNuxtPlugin((nuxtApp) => {
  const oidcClient = new OidcClient({ baseUrl: '/api' });
  nuxtApp.provide('oidc', oidcClient);
});
