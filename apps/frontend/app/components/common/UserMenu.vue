<template>
  <VMenu
    :close-on-content-click="false"
    attach="#mainAppBar"
    width="250"
    offset="10"
    transition="slide-y-transition"
  >
    <template #activator="{ props }">
      <UserAvatar
        v-bind="props"
        :img-url="user.imgUrl"
        aria-label="User menu"
        class="mr-4 ml-2"
        tag="button"
      />
    </template>
    <VList class="break-word text-left" density="compact" rounded="lg" nav>
      <div class="d-flex flex-column pa-4 align-center text-center">
        <UserAvatar :img-url="user.imgUrl" size="x-large" />
        <div class="text-body-large font-weight-semibold mt-2">
          {{ user.label }}
        </div>
        <div v-if="user.fullName" class="text-body-small text-medium-emphasis">
          {{ user.email }}
        </div>
      </div>
      <VDivider class="mx-n2 mb-2" />
      <template v-if="authStore.hasAdminAccess">
        <VListItem
          :to="{
            name: authStore.isAdmin ? 'system-user-management' : 'user-groups',
          }"
          title="Admin"
          prepend-icon="mdi-account-cog-outline"
        />
      </template>
      <VListItem
        :to="{ name: 'user-profile' }"
        title="Profile"
        prepend-icon="mdi-account-circle-outline"
        rounded="lg"
      />
      <ThemeSwitcher submenu />
      <VListItem
        title="Logout"
        prepend-icon="mdi-logout"
        rounded="lg"
        @click="logout"
      />
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
import type { User } from '@tailor-cms/interfaces/user';
import { UserAvatar } from '@tailor-cms/core-components';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue';

defineProps<{ user: User }>();

const { $oidc } = useNuxtApp() as any;
const config = useConfigStore();
const authStore = useAuthStore();

const logout = async () => {
  if (authStore.isOidcActive && config.props.oidcLogoutEnabled) {
    return $oidc.logout();
  }
  await authStore.logout();
  navigateTo('/auth');
};
</script>
