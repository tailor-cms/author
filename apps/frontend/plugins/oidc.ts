import OidcClient from '@/lib/OidcClient';

export default defineNuxtPlugin((nuxtApp) => {
  const { oidcEnabled, oidcLogoutEnabled } = useRuntimeConfig().public;
  const oidcClient = new OidcClient({
    baseUrl: '/api',
    enabled: oidcEnabled,
    logoutEnabled: oidcLogoutEnabled,
  });
  nuxtApp.provide('oidc', oidcClient);
});
