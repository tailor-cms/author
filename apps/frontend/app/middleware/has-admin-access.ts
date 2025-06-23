import { useAuthStore } from '@/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  await authStore.fetchUserInfo();
  if (authStore.isAdmin) return;
  if (
    authStore.groupsWithAdminAccess?.length &&
    to.path.includes('/admin/user-groups')
  )
    return;
  if (to.path !== '/') return navigateTo('/');
  navigateTo('/auth');
});
