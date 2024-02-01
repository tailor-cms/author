<template>
  <div class="repo-search">
    <div :style="{ width: isExpanded ? '98%' : '85%' }">
      <VTextField
        v-focus="isExpanded"
        @focus="isExpanded = true"
        @blur="isExpanded = false"
        @update:modelValue="emitChange"
        v-model="internalValue"
        :bg-color="`primary-darken-${isExpanded ? 1 : 2}`"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search..."
        variant="tonal"
        clearable hide-details
        class="pb-5" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import debounce from 'lodash/debounce';

export interface Props {
  searchInput: String;
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
</style>
