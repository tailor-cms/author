<template>
  <VTextField
    v-model="internalValue"
    bg-color="surface-container"
    class="repo-search"
    aria-label="Search repositories"
    placeholder="Search..."
    prepend-inner-icon="mdi-magnify"
    rounded="pill"
    variant="solo-filled"
    density="comfortable"
    :max-width="isExpanded ? 512 : 384"
    min-width="220"
    clearable
    flat
    hide-details
    @blur="isExpanded = false"
    @focus="isExpanded = true"
    @update:model-value="emitChange"
  />
</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';

export interface Props {
  searchInput?: string;
}

const props = withDefaults(defineProps<Props>(), {
  searchInput: '',
});

const emit = defineEmits(['update']);

const isExpanded = ref(false);
const internalValue = ref(props.searchInput);

const emitChange = debounce((val) => {
  emit('update', val && val.trim());
}, 500);

watch(
  () => props.searchInput,
  (val) => {
    if (val) return;
    internalValue.value = '';
  },
);
</script>

<style lang="scss" scoped>
.repo-search {
  transition: max-width 0.3s ease;
}

:deep(input::placeholder) {
  opacity: 0.75;
}
</style>
