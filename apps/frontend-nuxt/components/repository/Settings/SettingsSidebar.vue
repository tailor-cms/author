<template>
  <VSheet color="transparent">
    <VList
      active-class="bg-white"
      bg-color="primary-darken-4"
      class="text-primary-lighten-4 text-left mb-6 py-0"
      color="primary-darken-4"
      elevation="3"
      rounded="lg"
    >
      <VListItem
        v-for="{ name, label, icon, query } in routes"
        :key="name"
        :to="{ name, query }"
      >
        <template #prepend>
          <VIcon>mdi-{{ icon }}</VIcon>
        </template>
        <VListItemTitle>
          {{ label }}
        </VListItemTitle>
      </VListItem>
    </VList>
    <VList
      bg-color="primary-darken-4"
      class="text-left text-primary-lighten-4"
      elevation="3"
      rounded="lg"
    >
      <VListSubheader class="text-primary-lighten-5">Actions</VListSubheader>
      <VListItem
        v-for="{ label, name, icon, color } in actions"
        :key="name"
        @click="$emit('action', name)"
      >
        <template #prepend>
          <VIcon :color="color ? color : 'primary-lighten-5'">
            mdi-{{ icon }}
          </VIcon>
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
    { label: 'General', name: 'repository-settings-general', icon: 'wrench' },
    { label: 'People', name: 'repository-settings-users', icon: 'account' },
  ].map((it) => ({ ...it, query: route.query }));
});

const actions = computed(() => [
  { label: 'Clone', icon: 'content-copy', name: 'clone' },
  { label: 'Publish', icon: 'upload', name: 'publish' },
  { label: 'Export', icon: 'export', name: 'export' },
  { label: 'Delete', icon: 'delete', name: 'delete', color: 'red-lighten-3' },
]);
</script>
