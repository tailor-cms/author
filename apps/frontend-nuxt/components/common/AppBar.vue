<template>
  <VAppBar class="elevation-0" color="primary-darken-3" height="80">
    <a class="app-brand pl-4 pt-1" href="/">
      <img
        alt="Tailor logo"
        class="pt-2"
        height="44"
        src="/img/default-logo-full.svg"
        width="44"
      />
      <VAppBarTitle class="app-name py-1 pl-1 text-primary-lighten-3">
        Tailor
        <span class="text-caption font-weight-bold">
          <span class="text-primary-lighten-2 text-uppercase">
            authoring meets
          </span>
          <span class="text-secondary-lighten-2">AI</span>
        </span>
      </VAppBarTitle>
    </a>
    <template #append>
      <VBtn
        v-for="{ name, to } in routes"
        :key="name"
        :rounded="false"
        :to="to"
        color="secondary-lighten-4"
        height="100"
        variant="text"
      >
        <span class="toolbar-route text-truncate">{{ name }}</span>
      </VBtn>
      <VMenu
        min-width="220px"
        transition="slide-y-transition"
        z-index="1000"
        offset="24"
      >
        <template #activator="{ props }">
          <VBtn v-bind="props" class="mx-2" icon>
            <VAvatar color="teal-accent-4" size="36">
              <img :src="user.imgUrl" alt="User avatar" width="34" />
            </VAvatar>
          </VBtn>
        </template>
        <VList class="text-left">
          <VListItem>
            <VListItemTitle>{{ user.email }}</VListItemTitle>
          </VListItem>
          <VListItem to="/">
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

import { useAuthStore } from '@/stores/auth';
import { useCurrentRepository } from '@/stores/current-repository';

defineProps<{ user: any }>();

const authStore = useAuthStore();
const currentRepositoryStore = useCurrentRepository();
const { repository } = storeToRefs(currentRepositoryStore);

const routes = computed(() => {
  const items = [
    { name: 'Catalog', to: '/' },
    { name: 'Admin', to: '/admin' },
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
  padding-bottom: 0.125rem;
  text-decoration: none;
  cursor: pointer;

  .app-name {
    margin: 0.125rem 0 0 0.375rem;
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
