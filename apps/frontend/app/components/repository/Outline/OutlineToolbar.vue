<template>
  <div class="toolbar d-flex align-center justify-end flex-wrap ga-4 mb-2">
    <VHover>
      <template #default="{ isHovering, props: hoverProps }">
        <VTextField
          v-bind="hoverProps"
          v-model="searchInput"
          :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
          density="comfortable"
          placeholder="Search by name or id..."
          prepend-inner-icon="mdi-magnify"
          rounded="xl"
          variant="outlined"
          min-width="220"
          clearable
          hide-details
          @click:clear="resetInput"
        />
      </template>
    </VHover>
    <VBtn
      v-if="!isFlat"
      :disabled="!!props.search"
      class="px-5"
      color="primary-lighten-4"
      height="42"
      variant="tonal"
      @click="currentRepositoryStore.toggleOutlineExpand"
    >
      Toggle all
    </VBtn>
  </div>
</template>

<script lang="ts" setup>
import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  isFlat?: boolean;
  search?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isFlat: false,
  search: '',
});
const emit = defineEmits(['search']);

const currentRepositoryStore = useCurrentRepository();
const searchInput = ref('');

const resetInput = () => {
  searchInput.value = '';
  emit('search', '');
};

watch(
  () => searchInput.value,
  (value) => {
    emit('search', value);
  },
);
</script>

<style lang="scss" scoped>
.toolbar {
  z-index: 1;
}

.v-text-field {
  max-width: 24rem;
  transition: all 1s;

  :deep(.v-field__outline) {
    display: none;
  }
}

:deep(input::placeholder) {
  opacity: 0.75;
}
</style>
