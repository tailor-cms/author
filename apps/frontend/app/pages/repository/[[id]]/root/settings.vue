<template>
  <div class="repository-settings">
    <VNavigationDrawer
      color="surface-container-low"
      elevation="0"
      location="left"
      order="1"
      width="380"
      permanent
    >
      <VList class="pa-4 text-left" nav>
        <VListItem
          v-for="item in sections"
          :key="item.name"
          :prepend-icon="item.icon"
          :subtitle="item.subtitle"
          :title="item.label"
          :to="{ name: item.name }"
          rounded="lg"
        />
      </VList>
    </VNavigationDrawer>
    <VMain class="settings-main">
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

const sections = [
  {
    name: 'repository-settings-general',
    label: 'General',
    subtitle: 'Name, description, and metadata',
    icon: 'mdi-tune',
  },
  {
    name: 'repository-settings-members',
    label: 'Members',
    subtitle: 'Individual user access and roles',
    icon: 'mdi-account-multiple-outline',
  },
  {
    name: 'repository-settings-groups',
    label: 'Groups',
    subtitle: 'Bulk access via user groups',
    icon: 'mdi-account-group-outline',
  },
];

onMounted(() => {
  if (currentRepositoryStore?.repository?.hasAdminAccess) return;
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
</style>
