import authAPI from '@/api/auth';
import type { RouteLocationNormalized } from '#vue-router';
import { useAuthStore } from '@/stores/auth';

export default async function (to: RouteLocationNormalized) {
  if (to.name === 'auth') return;
  const isAuthenticated = useCookie('is-authenticated');
  const authStore = useAuthStore();
  if (isAuthenticated.value && authStore.user) return;
  const { data } = await authAPI.getUserInfo();
  authStore.user = data.user;
  isAuthenticated.value = true;
}
