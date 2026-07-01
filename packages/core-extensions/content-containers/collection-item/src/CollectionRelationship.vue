<template>
  <div class="collection-relationship">
    <div class="d-flex align-center mb-2">
      <span
        :class="errorMessage ? 'text-error' : 'text-medium-emphasis'"
        class="text-body-small"
      >
        {{ config.label }}<template v-if="config.allowEmpty === false">*</template>
      </span>
      <CreateRelatedRecord
        :config="config"
        :is-disabled="isDisabled"
        @created="appendSelection"
      />
    </div>
    <VAutocomplete
      v-model="model"
      :chips="config.multiple"
      :clearable="!config.multiple"
      :disabled="isDisabled || !items.length"
      :error-messages="errorMessage"
      :items="items"
      :multiple="config.multiple"
      :placeholder="placeholder"
      class="pb-1"
      item-title="name"
      item-value="id"
      variant="outlined"
      closable-chips
      @update:model-value="onChange"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import CreateRelatedRecord from './CreateRelatedRecord.vue';

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

const placeholder = computed(() => {
  if (!items.value.length) return 'No items available';
  return props.config.placeholder || 'Click to select';
});

const toIds = (refs) =>
  (refs ?? []).map((it) => (it && typeof it === 'object' ? it.id : it));

const emitRefs = (ids) => emit('update', ids.map((id) => ({ id })));

const fromModelValue = () => {
  const ids = toIds(props.modelValue);
  return props.config.multiple ? ids : (ids[0] ?? null);
};

const model = ref(fromModelValue());

watch(
  () => props.modelValue,
  () => {
    model.value = fromModelValue();
  },
  { deep: true },
);

const onChange = (value) => {
  const ids = value == null ? [] : Array.isArray(value) ? value : [value];
  emitRefs(ids);
};

// Append a freshly created record to the current selection.
const appendSelection = (id) => {
  const existing = toIds(props.modelValue);
  const ids = props.config.multiple ? [...new Set([...existing, id])] : [id];
  emitRefs(ids);
};
</script>
