<template>
  <div class="repository-settings">
    <VNavigationDrawer
      v-model="showSidebar"
      color="surface-canvas"
      elevation="0"
      location="left"
      mobile-breakpoint="md"
      order="1"
      width="380"
    >
      <div class="d-flex align-center justify-space-between px-4 pt-4 mb-1">
        <div class="text-title-medium font-weight-bold ml-1">Settings</div>
        <VBtn
          v-tooltip:bottom="{ text: 'Collapse sidebar', openDelay: 500 }"
          aria-label="Collapse sidebar"
          icon="mdi-chevron-double-left"
          size="small"
          density="comfortable"
          variant="tonal"
          @click="showSidebar = false"
        />
      </div>
      <VList density="compact" class="px-3 text-left" nav>
        <VListItem
          v-for="item in sections"
          :key="item.name"
          :prepend-icon="item.icon"
          :title="item.label"
          :to="{ name: item.name }"
          color="primary"
          rounded="12"
        />
      </VList>
    </VNavigationDrawer>
    <VMain class="settings-main">
      <VFadeTransition>
        <VBtn
          v-if="!showSidebar"
          v-tooltip:right="{ text: 'Open sidebar', openDelay: 500 }"
          class="sidebar-toggle"
          color="primary-container"
          aria-label="Open sidebar"
          density="comfortable"
          icon="mdi-chevron-double-right"
          size="small"
          @click="showSidebar = true"
        />
      </VFadeTransition>
      <NuxtPage />
    </VMain>
  </div>
</template>

<script lang="ts" setup>
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  name: 'repository-settings',
  redirect: { name: 'repository-settings-general' },
});

const currentRepositoryStore = useCurrentRepository();

const showSidebar = ref(true);

const sections = [
  {
    name: 'repository-settings-general',
    label: 'General',
    icon: 'mdi-tune',
  },
  {
    name: 'repository-settings-members',
    label: 'Members',
    icon: 'mdi-account-multiple',
  },
  {
    name: 'repository-settings-groups',
    label: 'Groups',
    icon: 'mdi-account-group',
  },
];

onMounted(() => {
  if (!currentRepositoryStore.access.canAccessSettings)
    navigateTo({ name: 'catalog' });
});
</script>

<style lang="scss" scoped>
.repository-settings {
  height: 100%;
}

.settings-main {
  height: 100%;
  min-height: 0;
}

.sidebar-toggle {
  position: absolute;
  width: 1.5rem;
  height: 3.5rem;
  top: 4rem;
  left: 0;
  transform: translateY(-50%);
  z-index: 1004;
  border-radius: 0 8px 8px 0;
}
</style>
