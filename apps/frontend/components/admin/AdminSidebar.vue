<template>
  <VSheet class="overflow-hidden" color="primary-lighten-4" rounded="lg">
    <VList bg-color="transparent" class="text-left mb-6">
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
const route = useRoute();

const routes = computed(() => {
  return [
    { label: 'System Users', name: 'system-user-management', icon: 'account' },
    { label: 'User Groups', name: 'user-groups', icon: 'account-group' },
    { label: 'Structure Types', name: 'installed-schemas', icon: 'file-tree' },
    { label: 'Installed Elements', name: 'installed-elements', icon: 'puzzle' },
  ].map((it) => ({ ...it, query: route.query }));
});
</script>
