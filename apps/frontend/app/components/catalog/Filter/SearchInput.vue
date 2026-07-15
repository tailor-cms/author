<template>
  <div class="repo-search">
    <VTextField
      v-model="internalValue"
      :bg-color="isExpanded ? 'surface-container-high' : 'surface-container' "
      aria-label="Search repositories"
      placeholder="Search..."
      prepend-inner-icon="mdi-magnify"
      rounded="pill"
      variant="solo-filled"
      density="comfortable"
      clearable
      flat
      hide-details
      @blur="isExpanded = false"
      @focus="isExpanded = true"
      @update:model-value="emitChange"
    />
  </div>
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
  > div {
    margin: 0 auto;
    transition: width 0.3s ease;
  }
}

:deep(input::placeholder) {
  opacity: 0.75;
}
</style>
