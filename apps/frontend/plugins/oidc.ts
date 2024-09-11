import OidcClient from '@/lib/OidcClient';
import { useConfigStore } from '@/stores/config';

export default defineNuxtPlugin((nuxtApp) => {
  const configStore = useConfigStore();
  const oidcClient = new OidcClient({
    baseUrl: '/api',
    enabled: configStore.oidc.enabled,
    logoutEnabled: configStore.oidc.logoutEnabled,
  });
  nuxtApp.provide('oidc', oidcClient);
});
