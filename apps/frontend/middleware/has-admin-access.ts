import { useAuthStore } from '@/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  await authStore.fetchUserInfo();
  if (!authStore.hasAdminAccess && to.path !== '/') {
    return navigateTo('/');
  }
  if (!authStore.hasAdminAccess && to.path !== '/admin/group-management') {
    return navigateTo('/');
  }
});
