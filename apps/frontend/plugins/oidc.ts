import OidcClient from '@/lib/OidcClient';
import { useConfigStore } from '@/stores/config';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useConfigStore();
  const oidcClient = new OidcClient({
    baseUrl: '/api',
    enabled: config.props.oidcEnabled,
    logoutEnabled: config.props.oidcLogoutEnabled,
  });
  nuxtApp.provide('oidc', oidcClient);
});
