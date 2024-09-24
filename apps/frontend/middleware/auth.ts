import { useAuthStore } from '@/stores/auth';

export default async function () {
  const isAuthenticated = useCookie('is-authenticated');
  const authStore = useAuthStore();
  if (authStore.user) return;
  await authStore.fetchUserInfo();
  isAuthenticated.value = authStore.user ? 'true' : null;
  if (!isAuthenticated.value) return navigateTo({ name: 'sign-in' });
}
