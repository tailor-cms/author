<template>
  <div class="admin-sidebar overflow-hidden">
    <VList bg-color="transparent" class="text-left" nav>
      <VListItem
        v-for="{ name, label, subtitle, icon, query } in routes"
        :key="name"
        :prepend-icon="`mdi-${icon}`"
        :subtitle="subtitle"
        :title="label"
        :to="{ name, query }"
      />
    </VList>
  </div>
</template>

<script lang="ts" setup>
const authStore = useAuthStore();
const route = useRoute();

const routes = computed(() => {
  return [
    authStore.isAdmin && {
      label: 'System Users',
      subtitle: 'Manage user accounts and roles',
      name: 'system-user-management',
      icon: 'account',
    },
    {
      label: 'User Groups',
      subtitle: 'Manage user groups and members',
      name: 'user-groups',
      icon: 'account-group',
    },
    authStore.isAdmin && {
      label: 'Structure Types',
      subtitle: 'Browse installed repository schemas',
      name: 'installed-schemas',
      icon: 'file-tree',
    },
    authStore.isAdmin && {
      label: 'Installed Elements',
      subtitle: 'Browse available content elements',
      name: 'installed-elements',
      icon: 'puzzle',
    },
  ]
    .filter((it) => it)
    .map((it) => ({ ...it, query: route.query }));
});
</script>
