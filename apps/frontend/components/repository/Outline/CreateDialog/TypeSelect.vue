<template>
  <VSelect
    :disabled="props.disabled"
    :items="options"
    :menu-props="{ attach: containerId }"
    :model-value="value"
    class="required"
    data-testid="type-select"
    item-title="label"
    item-value="type"
    label="Type"
    name="type"
    variant="outlined"
    @update:model-value="$emit('change', $event)"
  >
    <template #item="{ props: itemProps, item: { raw } }">
      <VListItem
        v-bind="itemProps"
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
  containerId: { type: String, default: '' },
});

const hasSubtypes = (outlineItemConfig: any) => {
  return !!outlineItemConfig.subLevels?.length;
};
</script>
