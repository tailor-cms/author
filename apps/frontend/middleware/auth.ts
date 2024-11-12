import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { useNuxtApp } from '#app';

export default async function () {
  const isAuthenticated = useCookie('is-authenticated');
  const authStore = useAuthStore();
  if (authStore.user) return;
  await authStore.fetchUserInfo();
  isAuthenticated.value = authStore.user ? 'true' : null;
  if (!isAuthenticated.value) return navigateTo({ name: 'sign-in' });
  await statsigInit();
}

const statsigInit = async () => {
  const authStore = useAuthStore();
  const config = useConfigStore();
  if (!config.props.statsigKey || !authStore.user?.email) return;
  const nuxtApp: any = useNuxtApp();
  await nuxtApp.$statsigInit(config.props.statsigKey, authStore.user.email);
};
