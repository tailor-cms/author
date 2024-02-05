<template>
  <div class="repo-search">
    <div :style="{ width: isExpanded ? '98%' : '85%' }">
      <VTextField
        v-model="internalValue"
        v-focus="isExpanded"
        :bg-color="`primary-darken-${isExpanded ? 1 : 2}`"
        class="pb-5"
        placeholder="Search..."
        prepend-inner-icon="mdi-magnify"
        variant="tonal"
        clearable
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
