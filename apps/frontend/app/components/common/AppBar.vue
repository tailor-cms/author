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
      class="d-flex align-center ml-2 ga-2"
      aria-label="Global"
    >
      <VBtn
        class="px-3 text-body-medium font-weight-medium"
        height="32"
        rounded="lg"
        text="Catalog"
        variant="text"
        :to="{ name: 'catalog' }"
      />
      <RepositorySelector
        v-if="currentRepository"
        :repository="currentRepository"
      />
    </nav>
    <template #append>
      <RenoirLauncher class="ml-2" />
      <UserMenu :user="user" />
    </template>
  </VAppBar>
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import type { User } from '@tailor-cms/interfaces/user';
import { useCurrentRepository } from '@/stores/current-repository';
import RepositorySelector from '@/components/common/RepositorySelector.vue';
import UserMenu from '@/components/common/UserMenu.vue';
import RenoirLauncher from '@/components/common/AgentPanel/RenoirLauncher.vue';

defineProps<{ user: User }>();

const { smAndDown } = useDisplay();

const currentRepositoryStore = useCurrentRepository();

const currentRepository = computed(() => currentRepositoryStore.repository);
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
