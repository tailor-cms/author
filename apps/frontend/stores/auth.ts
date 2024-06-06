import { auth as api } from '@/api';
import type { User } from '@/api/interfaces/user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  function $reset({ user: userData = null } = {}) {
    user.value = userData;
  }

  function login(credentials: {
    email: string;
    password: string;
  }): Promise<void> {
    return api
      .login(credentials)
      .then(({ data: { user } }) => $reset({ user }));
  }

  function logout() {
    return api.logout().then(() => $reset());
  }

  function forgotPassword({ email }: { email: string }) {
    return api.forgotPassword(email);
  }

  function resetPassword({
    password,
    token,
  }: {
    password: string;
    token: string;
  }) {
    return api.resetPassword(token, password);
  }

  function changePassword({
    currentPassword,
    newPassword,
  }: {
    currentPassword: string;
    newPassword: string;
  }) {
    return api.changePassword(currentPassword, newPassword);
  }

  function fetchUserInfo() {
    return api
      .getUserInfo()
      .then(({ data: { user } }) => $reset({ user }))
      .catch(() => {
        $reset();
      });
  }

  function updateInfo(payload: any) {
    return api
      .updateUserInfo(payload)
      .then(({ data }) => (user.value = data.user));
  }

  return {
    user,
    isAdmin,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    fetchUserInfo,
    updateInfo,
    $reset,
  };
});
