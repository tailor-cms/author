<template>
  <VList
    class="admin-sidebar py-0 px-3 text-left"
    density="compact"
    bg-color="transparent"
    nav
  >
    <VListItem
      v-for="{ name, label, icon, query } in routes"
      :key="name"
      :prepend-icon="`mdi-${icon}`"
      :title="label"
      :to="{ name, query }"
      color="primary"
      rounded="12"
    />
  </VList>
</template>

<script lang="ts" setup>
const authStore = useAuthStore();
const route = useRoute();

const routes = computed(() => {
  return [
    authStore.isAdmin && {
      label: 'System Users',
      name: 'system-user-management',
      icon: 'account',
    },
    {
      label: 'User Groups',
      name: 'user-groups',
      icon: 'account-group',
    },
    authStore.isAdmin && {
      label: 'Structure Types',
      name: 'installed-schemas',
      icon: 'file-tree',
    },
    authStore.isAdmin && {
      label: 'Installed Elements',
      name: 'installed-elements',
      icon: 'puzzle',
    },
  ]
    .filter((it) => it)
    .map((it) => ({ ...it, query: route.query }));
});
</script>
