<template>
  <VSheet
    class="settings-sidebar overflow-hidden"
    color="primary-lighten-4"
    rounded="lg"
  >
    <VList bg-color="transparent" class="text-left mb-6 py-0" slim>
      <VListItem
        v-for="{ name, label, icon, query } in routes"
        :key="name"
        :to="{ name, query }"
        :prepend-icon="`mdi-${icon}`"
        :title="label"
        active-class="bg-primary-lighten-4 text-primary-darken-4"
        class="mb-2 pa-4"
        rounded="lg"
      />
    </VList>
    <VList bg-color="transparent" class="text-left">
      <VListSubheader class="text-primary-darken-4">Actions</VListSubheader>
      <VListItem
        v-for="{ color, icon, label, name } in actions"
        :key="name"
        class="pa-4"
        @click="$emit('action', name)"
      >
        <template #prepend>
          <VIcon :color="color ? color : 'primary-darken-5'">
            mdi-{{ icon }}
          </VIcon>
        </template>
        <VListItemTitle>{{ label }}</VListItemTitle>
      </VListItem>
    </VList>
  </VSheet>
</template>

<script lang="ts" setup>
defineEmits(['action']);

const route = useRoute();

const routes = computed(() => {
  return [
    { label: 'General', name: 'repository-settings-general', icon: 'wrench' },
    {
      label: 'Access management',
      name: 'repository-settings-users',
      icon: 'shield-account-outline',
    },
  ].map((it) => ({ ...it, query: route.query }));
});

const actions = computed(() => [
  { label: 'Clone', icon: 'content-copy', name: 'clone' },
  { label: 'Publish', icon: 'upload', name: 'publish' },
  { label: 'Export', icon: 'export', name: 'export' },
  { label: 'Delete', icon: 'delete', name: 'delete', color: 'red-darken-4' },
]);
</script>
