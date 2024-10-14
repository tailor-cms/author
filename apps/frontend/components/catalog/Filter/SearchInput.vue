<template>
  <div class="repo-search">
    <div :style="{ width: mdAndDown || isExpanded ? '100%' : '85%' }">
      <VTextField
        v-model="internalValue"
        :bg-color="`primary-darken-${isExpanded ? 1 : 2}`"
        aria-label="Search repositories"
        class="pb-5"
        placeholder="Search..."
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        clearable
        flat
        hide-details
        @blur="isExpanded = false"
        @focus="isExpanded = true"
        @update:model-value="emitChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import debounce from 'lodash/debounce';
import { useDisplay } from 'vuetify';

export interface Props {
  searchInput: string;
}

const props = withDefaults(defineProps<Props>(), {
  searchInput: '',
});

const emit = defineEmits(['update']);

const { mdAndDown } = useDisplay();

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
