import type { User } from '@tailor-cms/interfaces/user';
import type { UserGroupWithRole } from '@tailor-cms/interfaces/user-group';
import type { UserUpdateProfileReq } from '@tailor-cms/api-client';
import { UserRole } from '@tailor-cms/interfaces/role';

import { api } from '@/api';

type AuthData = { strategy?: string };

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
    return api.user
      .login({ body: credentials })
      .then(({ user, userGroups, authData }) =>
        $reset(user, userGroups, (authData as AuthData)?.strategy),
      );
  }

  function logout() {
    return api.user.logout().then(() => $reset());
  }

  function forgotPassword({ email }: { email: string }) {
    return api.user.forgotPassword({ body: { email } });
  }

  function resetPassword({
    password,
    token,
  }: {
    password: string;
    token: string;
  }) {
    return api.user.resetPassword({ body: { password, token } });
  }

  function changePassword({
    currentPassword,
    newPassword,
  }: {
    currentPassword: string;
    newPassword: string;
  }) {
    return api.user.changePassword({
      body: { currentPassword, newPassword },
    });
  }

  function fetchUserInfo() {
    return api.user
      .me()
      .then(({ user, userGroups, authData }) =>
        $reset(user, userGroups, (authData as AuthData)?.strategy),
      )
      .catch(() => $reset());
  }

  function updateInfo(payload: UserUpdateProfileReq['body']) {
    return api.user
      .updateProfile({ body: payload })
      .then(({ user: updated }) => (user.value = updated));
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
