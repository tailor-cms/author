<template>
  <VSelect
    :disabled="props.disabled"
    :items="options"
    :menu-props="{ offset: 10, maxHeight: 220 }"
    :model-value="value"
    class="required"
    item-title="label"
    item-value="type"
    label="Type"
    name="type"
    variant="outlined"
    @update:model-value="$emit('change', $event)"
  >
    <template #item="{ props, item: { raw } }">
      <VListItem
        v-bind="props"
        :prepend-icon="`mdi-${hasSubtypes(raw) ? 'folder' : 'file-outline'}`"
      />
    </template>
  </VSelect>
</template>

<script lang="ts" setup>
const props = defineProps({
  value: { type: String, default: null },
  options: { type: Array, required: true },
  disabled: { type: Boolean, default: false },
});

const hasSubtypes = (outlineItemConfig: any) => {
  return !!outlineItemConfig.subLevels?.length;
};
</script>
