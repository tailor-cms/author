import type { User } from '@tailor-cms/interfaces/user';

import { auth as api } from '@/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const userGroups = ref<any[]>([]);
  const strategy = ref<string | null>(null);

  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isDefaultUser = computed(() => user.value?.role === 'USER');
  const isOidcActive = computed(() => strategy.value === 'oidc');

  const hasGroupBoundAccess = computed(
    () => !isAdmin.value && !isDefaultUser.value,
  );

  const hasDefaultUserGroup = computed(() => {
    if (!hasGroupBoundAccess.value) return false;
    return userGroups.value.length === 1;
  });

  const groupsWithCreateRepositoryAccess = computed(() =>
    userGroups.value.filter(
      (group) => group.role === 'ADMIN' || group.role === 'USER',
    ),
  );

  const hasCreateRepositoryAccess = computed(
    () => groupsWithCreateRepositoryAccess.value.length > 0,
  );

  function $reset(
    userData: User | null = null,
    userGroupData: any[] = [],
    authStrategy: string | null = null,
  ) {
    user.value = userData;
    userGroups.value = userGroupData;
    strategy.value = authStrategy;
  }

  function login(credentials: {
    email: string;
    password: string;
  }): Promise<void> {
    return api
      .login(credentials)
      .then(({ data: { user, authData } }) => $reset(user, authData?.strategy));
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
      .then(({ data: { user, userGroups, authData } }) =>
        $reset(user, userGroups, authData?.strategy),
      )
      .catch(() => $reset());
  }

  function updateInfo(payload: any) {
    return api
      .updateUserInfo(payload)
      .then(({ data }) => (user.value = data.user));
  }

  return {
    user,
    userGroups,
    groupsWithCreateRepositoryAccess,
    strategy,
    isOidcActive,
    isAdmin,
    isDefaultUser,
    hasGroupBoundAccess,
    hasDefaultUserGroup,
    hasCreateRepositoryAccess,
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
