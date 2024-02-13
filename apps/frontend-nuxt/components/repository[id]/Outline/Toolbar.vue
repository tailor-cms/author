<template>
  <VToolbar color="transparent"  class="toolbar">
    <VTextField
      @input="$emit('search', $event)"
      @click:clear="$emit('search', '')"
      :value="search"
      bg-color="primary-darken-2"
      prepend-inner-icon="mdi-magnify"
      placeholder="Search by name or id..."
      variant="tonal"
      clearable
      hide-details
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

const currentRepositoryStore = useCurrentRepository();
</script>

<style lang="scss" scoped>
.toolbar {
  z-index: 1;
}
</style>
