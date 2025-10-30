import OidcClient from '@/lib/OidcClient';

export default defineNuxtPlugin(() => {
  const oidcClient = new OidcClient({ baseUrl: '/api' });
  const provide = { oidc: oidcClient };
  return { provide };
});
