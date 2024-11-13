import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { useNuxtApp } from '#app';

export default async function () {
  const isAuthenticated = useCookie('is-authenticated');
  const authStore = useAuthStore();
  if (authStore.user) return;
  await authStore.fetchUserInfo();
  isAuthenticated.value = authStore.user ? 'true' : null;
  if (isAuthenticated.value) await statsigInit();
  else return navigateTo({ name: 'sign-in' });
}

const statsigInit = async () => {
  const authStore = useAuthStore();
  const config = useConfigStore();
  if (!config.props.statsigKey || !authStore.user?.email) return;
  const nuxtApp: any = useNuxtApp();
  const client = await nuxtApp.$statsigInit(
    config.props.statsigKey,
    authStore.user.email,
  );
  if (!client) return;
  const dynamicConfig = await client.getDynamicConfig('personalizedconfig');
  config.personalize(dynamicConfig);
};
