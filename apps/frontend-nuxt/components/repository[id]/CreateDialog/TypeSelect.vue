<template>
  <VSelect
    :model-value="value"
    :items="options"
    :disabled="props.disabled"
    :menu-props="{ offset: 10, maxHeight: 220 }"
    item-title="label"
    item-value="type"
    name="type"
    label="Type"
    variant="outlined"
    class="required"
    @update:model-value="$emit('change', $event)"
  >
    <template v-slot:item="{ props, item: { raw } }">
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
