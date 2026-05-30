<template>
  <VAppBar id="mainAppBar" class="app-bar elevation-0">
    <NuxtLink :to="{ name: 'catalog' }" class="app-brand pl-5">
      <img
        alt="Tailor logo"
        class="mr-4"
        src="/img/logo-new.svg"
        width="36"
      />
      <VAppBarTitle class="app-name">
        Tailor
        <span v-if="!smAndDown" class="text-body-small font-weight-bold">
          <span class="text-uppercase">
            authoring meets
          </span>
          <span class="text-secondary">AI</span>
        </span>
      </VAppBarTitle>
    </NuxtLink>
    <template #append>
      <template v-if="!smAndDown">
        <VBtn
          v-for="{ name, to } in topLevelRoutes"
          :key="name"
          :to="to"
          min-width="96"
          variant="text"
          rounded="lg"
        >
          <span class="toolbar-route text-truncate">{{ name }}</span>
        </VBtn>
      </template>
      <VMenu
        attach="#mainAppBar"
        min-width="220"
        max-width="350"
        offset="10"
        transition="slide-y-transition"
      >
        <template #activator="{ props }">
          <UserAvatar
            v-bind="props"
            :img-url="user.imgUrl"
            aria-label="User menu"
            class="mx-4"
            tag="button"
          />
        </template>
        <VCard color="surface-container-low" class="text-left">
          <div class="d-flex px-4 py-3 align-center">
            <UserAvatar :img-url="user.imgUrl" size="38" />
            <div class="ml-4">
              <div class="text-body-large font-weight-bold">
                {{ user.label }}
              </div>
            </div>
          </div>
          <VList
            class="d-flex flex-column ga-1 pa-2"
            slim
          >
            <template v-if="smAndDown">
              <VListItem
                v-for="{ name, to, icon } in routes"
                :key="name"
                :to="to"
                :title="name"
                :prepend-icon="icon"
                rounded="lg"
              />
            </template>
            <VListItem
              :to="{ name: 'user-profile' }"
              title="Profile"
              prepend-icon="mdi-account-circle-outline"
              rounded="lg"
            />
            <VListItem
              :prepend-icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
              :title="isDark ? 'Light mode' : 'Dark mode'"
              rounded="lg"
              @click="toggle"
            />
            <VListItem
              title="Logout"
              prepend-icon="mdi-logout"
              rounded="lg"
              @click="logout"
            />
          </VList>
        </VCard>
      </VMenu>
    </template>
  </VAppBar>
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import type { User } from '@tailor-cms/interfaces/user';
import { UserAvatar } from '@tailor-cms/core-components';
import { useAuthStore } from '@/stores/auth';
import { useColorMode } from '@/composables/useColorMode';
import { useConfigStore } from '@/stores/config';

defineProps<{ user: User }>();

const { smAndDown } = useDisplay();
const { isDark, toggle } = useColorMode();

const { $oidc } = useNuxtApp() as any;
const config = useConfigStore();
const authStore = useAuthStore();
const topLevelRoutes = computed(() => {
  const items = [
    { name: 'Catalog', to: '/', icon: 'mdi-view-grid-plus-outline' },
    {
      name: 'Admin',
      to: {
        name: authStore.isAdmin ? 'system-user-management' : 'user-groups',
      },
      icon: 'mdi-account-cog-outline',
    },
  ];
  if (!authStore.hasAdminAccess) items.pop();
  return items;
});

const routes = computed(() => topLevelRoutes.value);

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

  .app-name {
    margin: 0 0 0 0.125rem;
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1.2;
    text-transform: uppercase;
  }
}

.top-route {
  letter-spacing: 0.04em;
  font-weight: 500;
}

.toolbar-route {
  max-width: 14rem;
}

.v-avatar img {
  padding: 0.125rem;
}

:deep(.v-toolbar__append) {
  gap: 0.25rem
}
</style>
