import OidcClient from '@/lib/oidc';

export default defineNuxtPlugin((nuxtApp) => {
  const oidcClient = new OidcClient({ baseUrl: '/api' });
  nuxtApp.provide('oidc', oidcClient);
});
