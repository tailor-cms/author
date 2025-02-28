import type { User } from '@tailor-cms/interfaces/user';
import type { UserGroupWithRole } from '@tailor-cms/interfaces/user-group';
import { UserRole } from '@tailor-cms/common';

import { auth as api } from '@/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const userGroups = ref<UserGroupWithRole[]>([]);
  const strategy = ref<string | null>(null);

  const isAdmin = computed(() => user.value?.role === UserRole.ADMIN);
  const isDefaultUser = computed(() => user.value?.role === UserRole.USER);
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
      (group) => group.role === UserRole.ADMIN || group.role === UserRole.USER,
    ),
  );

  const groupsWithAdminAccess = computed(() =>
    userGroups.value.filter((group) => group.role === UserRole.ADMIN),
  );

  const hasCreateRepositoryAccess = computed(
    () =>
      !hasGroupBoundAccess.value ||
      groupsWithCreateRepositoryAccess.value.length > 0,
  );

  const hasAdminAccess = computed(
    () => isAdmin.value || groupsWithAdminAccess.value.length > 0,
  );

  function $reset(
    userData: User | null = null,
    userGroupData: UserGroupWithRole[] = [],
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
    groupsWithAdminAccess,
    strategy,
    isOidcActive,
    isAdmin,
    isDefaultUser,
    hasGroupBoundAccess,
    hasAdminAccess,
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
