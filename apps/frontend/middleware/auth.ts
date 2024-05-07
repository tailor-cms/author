import { useAuthStore } from '@/stores/auth';

export default async function () {
  const isAuthenticated = useCookie('is-authenticated');
  if (!isAuthenticated.value) navigateTo({ name: 'sign-in' });
  const authStore = useAuthStore();
  if (authStore.user) return;
  await authStore.fetchUserInfo();
  isAuthenticated.value = authStore.user ? 'true' : null;
}
