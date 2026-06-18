<template>
  <VAutocomplete
    :chips="config.multiple"
    :class="{ required: config.allowEmpty === false }"
    :clearable="!config.multiple"
    :disabled="isDisabled || !items.length"
    :error-messages="errorMessage"
    :items="items"
    :label="config.label"
    :model-value="selected"
    :multiple="config.multiple"
    :placeholder="placeholder"
    class="pb-2"
    item-title="name"
    item-value="id"
    variant="outlined"
    closable-chips
    @update:model-value="onChange"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // The ActivityRelationship config (label, multiple, allowEmpty, allowedTypes).
  config: { type: Object, required: true },
  activities: { type: Array, default: () => [] },
  // Stored value: an array of `{ id }` pointers (the refs shape).
  modelValue: { type: Array, default: () => [] },
  ownerId: { type: Number, default: undefined },
  isDisabled: { type: Boolean, default: false },
  errorMessage: { type: String, default: undefined },
});

const emit = defineEmits(['update']);

const linkableActivities = computed(() => {
  const allowedTypes = props.config.allowedTypes ?? [];
  return props.activities.filter((it) => {
    if (!allowedTypes.includes(it.type)) return false;
    if (it.deletedAt) return false;
    if (props.config.allowCircularLinks === false && it.id === props.ownerId) {
      return false;
    }
    return true;
  });
});

const items = computed(() =>
  linkableActivities.value.map((it) => ({
    id: it.id,
    name: it.data?.name || 'Untitled',
  })),
);

const selected = computed(() => {
  // Tolerate both `{ id }` pointers and bare ids on read.
  const ids = props.modelValue.map((it) => (it && typeof it === 'object' ? it.id : it));
  return props.config.multiple ? ids : ids[0];
});

const placeholder = computed(() => {
  if (!items.value.length) return 'No items available';
  return props.config.placeholder || 'Click to select';
});

const onChange = (value) => {
  const ids = value == null ? [] : Array.isArray(value) ? value : [value];
  // Store the refs as `{ id }` pointers (the activity refs schema).
  emit('update', ids.map((id) => ({ id })));
};
</script>
