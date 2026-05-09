<template>
  <div class="repository-settings">
    <VNavigationDrawer
      border="surface"
      color="primary-darken-3"
      elevation="0"
      location="left"
      order="1"
      width="380"
      permanent
    >
      <VList class="pa-4 text-left" slim>
        <VListItem
          v-for="item in sections"
          :key="item.name"
          :prepend-icon="item.icon"
          :subtitle="item.subtitle"
          :title="item.label"
          :to="{ name: item.name }"
          class="mb-2"
          lines="two"
          rounded="lg"
        />
      </VList>
    </VNavigationDrawer>
    <VMain>
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
    name: 'repository-settings-access',
    label: 'Access',
    subtitle: 'Users and groups',
    icon: 'mdi-shield-account-outline',
  },
];

onMounted(() => {
  if (currentRepositoryStore?.repository?.hasAdminAccess) return;
  navigateTo({ name: 'catalog' });
});
</script>
