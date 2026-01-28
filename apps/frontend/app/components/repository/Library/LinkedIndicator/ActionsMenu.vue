<template>
  <VMenu location="bottom end">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        color="primary-lighten-4"
        icon="mdi-dots-vertical"
        size="x-small"
        variant="text"
        @click.stop
      />
    </template>
    <VList density="compact">
      <template v-if="isEntryPoint">
        <VListItem
          prepend-icon="mdi-open-in-new"
          title="View source"
          @click="$emit('source:view')"
        />
        <VListItem
          prepend-icon="mdi-link-variant-off"
          title="Unlink"
          @click="$emit('source:unlink')"
        />
      </template>
      <VListItem
        v-else
        prepend-icon="mdi-arrow-up"
        title="Go to linked parent"
        @click="$emit('parent:navigate')"
      />
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
defineProps<{ isEntryPoint: boolean }>();
defineEmits<{
  'source:view': [];
  'source:unlink': [];
  'parent:navigate': [];
}>();
</script>
