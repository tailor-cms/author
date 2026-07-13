<template>
  <VAppBar id="mainAppBar" class="app-bar elevation-0" color="transparent">
    <NuxtLink
      :to="{ name: 'catalog' }"
      class="app-brand ml-5 mr-2"
      aria-label="Tailor"
    >
      <img alt="Tailor logo" src="/img/logo-new.svg" width="36" />
    </NuxtLink>
    <nav
      v-if="!smAndDown"
      class="d-flex align-center ml-2"
      aria-label="Breadcrumb"
    >
      <VBtn
        text="Catalog"
        variant="text"
        rounded="lg"
        class="px-2 text-body-medium font-weight-medium"
        height="32"
        :to="{ name: 'catalog' }"
      />
      <template v-if="currentRepository">
        <span class="text-disabled mx-1" aria-hidden="true">/</span>
        <RepositorySelector :repository="currentRepository" />
      </template>
    </nav>
    <template #append>
      <RenoirLauncher class="ml-2" />
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
            class="mr-4 ml-3"
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
  </VAppBar>
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import type { User } from '@tailor-cms/interfaces/user';
import { UserAvatar } from '@tailor-cms/core-components';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';
import RepositorySelector from '@/components/common/RepositorySelector.vue';
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue';
import RenoirLauncher from '@/components/common/AgentPanel/RenoirLauncher.vue';

defineProps<{ user: User }>();

const { smAndDown } = useDisplay();

const { $oidc } = useNuxtApp() as any;
const config = useConfigStore();
const authStore = useAuthStore();
const currentRepositoryStore = useCurrentRepository();

const currentRepository = computed(() => currentRepositoryStore.repository);

const logout = async () => {
  if (authStore.isOidcActive && config.props.oidcLogoutEnabled) {
    return $oidc.logout();
  }
  await authStore.logout();
  navigateTo('/auth');
};
</script>

<style lang="scss" scoped>
.app-bar {
  z-index: 10;

  .v-toolbar__content .v-btn.v-btn--icon {
    width: unset;
    height: unset;
  }
}

.app-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
}

.v-avatar img {
  padding: 0.125rem;
}

:deep(.v-toolbar__append) {
  gap: 0.25rem;
  // Let the Renoir launcher's thinking head spill out without being clipped.
  overflow: visible;
}
</style>
