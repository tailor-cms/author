<template>
  <VAppBar
    id="mainAppBar"
    class="elevation-0"
    color="primary-darken-3"
    height="80"
  >
    <NuxtLink :to="{ name: 'catalog' }" class="app-brand pt-2 pl-7">
      <img
        alt="Tailor logo"
        height="44"
        src="/img/default-logo-full.svg"
        width="44"
      />
      <VAppBarTitle class="app-name text-primary-lighten-3">
        Tailor
        <span v-if="!smAndDown" class="text-caption font-weight-bold">
          <span class="text-primary-lighten-3 text-uppercase">
            authoring meets
          </span>
          <span class="text-teal-lighten-4">AI</span>
        </span>
      </VAppBarTitle>
    </NuxtLink>
    <template #append>
      <VBtn
        v-for="{ name, to } in routes"
        :key="name"
        :rounded="false"
        :to="to"
        color="teal-lighten-5"
        height="100"
        min-width="120"
        variant="text"
      >
        <span class="toolbar-route text-truncate">{{ name }}</span>
      </VBtn>
      <VMenu
        attach="#mainAppBar"
        min-width="220px"
        offset="10"
        transition="slide-y-transition"
      >
        <template #activator="{ props }">
          <UserAvatar
            v-bind="props"
            :img-url="user.imgUrl"
            aria-label="User menu"
            class="mx-5"
            tag="button"
          />
        </template>
        <VList class="text-left pt-0">
          <VListItem class="py-5 bg-primary-lighten-4" disabled>
            <VListItemTitle>{{ user.email }}</VListItemTitle>
          </VListItem>
          <VListItem :to="{ name: 'user-profile' }">
            <VListItemTitle>Profile</VListItemTitle>
          </VListItem>
          <VListItem @click="logout">
            <VListItemTitle>Logout</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
    </template>
  </VAppBar>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useDisplay } from 'vuetify';
import type { User } from '@tailor-cms/interfaces/user';
import { UserAvatar } from '@tailor-cms/core-components';

import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';

defineProps<{ user: User }>();

const { smAndDown } = useDisplay();

const { $oidc } = useNuxtApp() as any;
const authStore = useAuthStore();
const currentRepositoryStore = useCurrentRepository();
const { repository } = storeToRefs(currentRepositoryStore);
const config = useConfigStore();

const routes = computed(() => {
  const items = [
    { name: 'Catalog', to: '/' },
    { name: 'Admin', to: { name: 'system-user-management' } },
  ];
  if (!authStore.isAdmin) items.pop();
  if (repository.value) {
    items.unshift({
      name: `${repository.value.name} structure`,
      to: `/repository/${repository.value?.id}/root/structure`,
    });
  }
  return items;
});

const logout = async () => {
  if (authStore.isOidcActive && config.props.oidcLogoutEnabled) {
    return $oidc.logout();
  }
  await authStore.logout();
  navigateTo('/auth');
};
</script>

<style lang="scss" scoped>
$container-height: 2.5rem;
$font-color: #333;

.v-toolbar {
  z-index: 10;

  .v-toolbar__content .v-btn.v-btn--icon {
    width: unset;
    height: unset;
  }

  .v-btn:not(.v-btn--active) {
    color: #fff !important;
  }
}

.app-brand {
  display: flex;
  text-decoration: none;
  cursor: pointer;

  .app-name {
    margin: 0.125rem 0 0 0.75rem;
    font-family: Poppins, Roboto, sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 1px;
    line-height: $container-height;
    text-transform: uppercase;
  }
}

.toolbar-route {
  max-width: 12.5rem;
}

.v-avatar img {
  padding: 0.125rem;
}
</style>
