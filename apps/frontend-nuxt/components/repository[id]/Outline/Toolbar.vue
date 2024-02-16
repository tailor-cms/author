<template>
  <VToolbar color="transparent" class="toolbar">
    <VTextField
      v-model="searchInput"
      bg-color="primary-darken-2"
      prepend-inner-icon="mdi-magnify"
      placeholder="Search by name or id..."
      variant="solo"
      clearable
      hide-details
      @click:clear="resetInput"
    />
    <VSpacer />
    <VBtn
      v-if="!isFlat"
      @click="currentRepositoryStore.toggleOutlineExpand"
      :disabled="!!props.search"
      color="primary-lighten-3"
      variant="text"
    >
      Toggle all
    </VBtn>
  </VToolbar>
</template>

<script lang="ts" setup>
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps({
  search: { type: String, default: '' },
  isFlat: { type: Boolean, default: false },
});

const emit = defineEmits(['search']);

const currentRepositoryStore = useCurrentRepository();
const searchInput = ref('');

const resetInput = () => {
  searchInput.value = '';
  emit('search', '');
};

watch(() => searchInput.value, (value) => {
  emit('search', value);
});
</script>

<style lang="scss" scoped>
.toolbar {
  z-index: 1;
}
</style>
