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
  // No admin access; bounce with a notice instead of a silent redirect.
  if (to.path !== '/') {
    const notify = useNotification();
    onNuxtReady(() =>
      notify('You do not have access to this page.', { color: 'error' }),
    );
    return navigateTo('/');
  }
  navigateTo('/auth');
});
