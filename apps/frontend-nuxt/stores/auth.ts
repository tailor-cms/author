import { auth as api } from '@/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);

  function $reset({ user = null } = {}) {
    user.value = user;
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
      .catch(() => $reset());
  }

  function updateInfo(payload: any) {
    return api
      .updateUserInfo(payload)
      .then(({ data }) => (user.value = data.user));
  }

  return {
    user,
    login,
    logout,
    forgotPassword,
    changePassword,
    fetchUserInfo,
    updateInfo,
    $reset,
  };
});
