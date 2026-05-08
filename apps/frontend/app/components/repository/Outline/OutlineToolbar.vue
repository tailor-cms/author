<template>
  <div class="toolbar d-flex align-center flex-wrap ga-4">
    <VHover>
      <template #default="{ props: hoverProps }">
        <VTextField
          v-bind="hoverProps"
          v-model="searchInput"
          :bg-color="'transparent'"
          density="compact"
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
    <VSpacer />
    <VBtn
      v-if="!isFlat"
      :disabled="!!props.search"
      color="teal-lighten-3"
      variant="tonal"
      rounded="lg"
      size="small"
      class="text-none"
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
