<template>
  <VSheet
    class="admin-sidebar overflow-hidden"
    color="primary-lighten-4"
    rounded="lg"
  >
    <VList bg-color="transparent" class="text-left">
      <VListItem
        v-for="{ name, label, icon, query } in routes"
        :key="name"
        :to="{ name, query }"
        active-class="bg-primary-lighten-4 text-primary-darken-4"
        class="mb-2 pa-4"
        rounded="lg"
      >
        <template #prepend>
          <VIcon>mdi-{{ icon }}</VIcon>
        </template>
        <VListItemTitle>
          {{ label }}
        </VListItemTitle>
      </VListItem>
    </VList>
  </VSheet>
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
    { label: 'User Groups', name: 'user-groups', icon: 'account-group' },
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
