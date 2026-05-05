<template>
  <div class="repo-container">
    <div class="toolbar d-flex elevation-1 align-center pr-2 justify-end">
      <ActiveUsers :users="activeUsers" class="mr-4" size="36" />
      <VBtn
        v-if="smAndDown && hasSidebar"
        icon="mdi-menu"
        variant="text"
        color="white"
        @click="store.updateSidebar(!store.isSidebarOpen)"
      />
    </div>
    <div class="tab-content">
      <NuxtPage />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ActiveUsers } from '@tailor-cms/core-components';

import { useCurrentRepository } from '@/stores/current-repository';
import { useUserTracking } from '@/stores/user-tracking';
import { useDisplay } from 'vuetify';

definePageMeta({
  middleware: ['auth'],
});

const store = useCurrentRepository();
const userTrackingStore = useUserTracking();
const { smAndDown } = useDisplay();
const route = useRoute();

useHead({
  title: store.repository?.name,
  meta: [{ name: 'description', content: 'Tailor CMS - Repository page' }],
});

const hasSidebar = computed(() => {
  const routeName = route.name;
  return routeName === 'repository' || routeName === 'progress';
});

const activeUsers = computed(() => {
  return userTrackingStore.getActiveUsers(
    'repository',
    store.repositoryId as number,
  );
});
</script>

<style lang="scss" scoped>
.repo-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.tab-content {
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  overflow-y: overlay;
}
</style>
