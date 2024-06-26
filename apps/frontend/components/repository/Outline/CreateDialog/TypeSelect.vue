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
interface Props {
  options: any[];
  value?: string | null;
  disabled?: boolean;
  containerId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  disabled: false,
  containerId: '',
});
defineEmits(['change']);

const hasSubtypes = (outlineItemConfig: any) => {
  return !!outlineItemConfig.subLevels?.length;
};
</script>
