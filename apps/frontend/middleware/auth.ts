import type { RouteLocationNormalized } from '#vue-router';
import { useAuthStore } from '@/stores/auth';

export default async function (to: RouteLocationNormalized) {
  if (to.name === 'auth') return;
  const isAuthenticated = useCookie('is-authenticated');
  const authStore = useAuthStore();
  if (isAuthenticated.value && authStore.user) return;
  await authStore.fetchUserInfo();
  isAuthenticated.value = authStore.user !== null;
}
