<template>
  <VAppBar
    id="mainAppBar"
    class="elevation-0"
    color="primary-darken-3"
    height="84"
  >
    <NuxtLink :to="{ name: 'catalog' }" class="app-brand pl-7">
      <img
        alt="Tailor logo"
        class="mr-6"
        src="/img/logo-new.svg"
        width="52"
      />
      <VAppBarTitle
        v-if="!showUserGroupSelect"
        class="app-name pt-1 text-primary-lighten-3"
      >
        Tailor
        <span v-if="!smAndDown" class="text-caption font-weight-bold">
          <span class="text-primary-lighten-3 text-uppercase">
            authoring meets
          </span>
          <span class="text-teal-lighten-4">AI</span>
        </span>
      </VAppBarTitle>
    </NuxtLink>
    <div v-if="showUserGroupSelect" class="pt-2">
      <VSelect
        v-model="repositoryStore.selectedUserGroupId"
        :items="repositoryStore.userGroupOptions"
        item-title="name"
        item-value="id"
        min-width="300"
        variant="outlined"
        hide-details
        @update:model-value="onUserGroupChange"
      >
        <template #selection="{ item }">
          <UserGroupAvatar :logo-url="item.raw.logoUrl" class="mr-5" />
          {{ item.title }}
        </template>
        <template #item="{ item, props: { title, ...restProps } }">
          <VListItem v-bind="restProps">
            <UserGroupAvatar
              :logo-url="item.raw.logoUrl"
              class="mr-5"
              placeholder-color="primary-darken-3"
            />
            {{ title }}
          </VListItem>
        </template>
      </VSelect>
    </div>
    <template #append>
      <template v-if="!smAndDown">
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
            class="mx-5"
            tag="button"
          />
        </template>
        <VCard color="primary-darken-3" class="text-left">
          <div class="d-flex pa-4 align-center">
            <UserAvatar :img-url="user.imgUrl" size="48" />
            <div class="text-primary-lighten-4 ml-4">
              <div
                v-if="user.firstName || user.lastName"
                class="text-subtitle-1 font-weight-bold"
              >
                {{ user.firstName }} {{ user.lastName }}
              </div>
              <div class="text-subtitle-2">
                {{ user.email }}
              </div>
            </div>
          </div>
          <VList
            class="d-flex flex-column ga-1 pa-2"
            color="primary-darken-3"
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
import { storeToRefs } from 'pinia';
import { useDisplay } from 'vuetify';
import type { User } from '@tailor-cms/interfaces/user';
import { UserAvatar } from '@tailor-cms/core-components';
import UserGroupAvatar from './UserGroupAvatar.vue';

import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';

defineProps<{ user: User }>();

const { smAndDown } = useDisplay();

const { $oidc } = useNuxtApp() as any;
const config = useConfigStore();
const authStore = useAuthStore();
const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();
const route = useRoute();

const { repository } = storeToRefs(currentRepositoryStore);

const routes = computed(() => {
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
  if (repository.value) {
    items.unshift({
      name: `${repository.value.name} structure`,
      to: `/repository/${repository.value?.id}/root/structure`,
      icon: 'mdi-file-tree-outline',
    });
  }
  return items;
});

const showUserGroupSelect = computed(
  () => authStore.userGroups.length > 0 && route.name === 'catalog',
);

const onUserGroupChange = async () => {
  repositoryStore.resetPaginationParams();
  await repositoryStore.fetch();
};

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
    margin: 0 0 0 0.125rem;
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
