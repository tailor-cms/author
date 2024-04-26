<template>
  <VToolbar class="toolbar" color="transparent">
    <VSpacer />
    <VHover>
      <template v-slot:default="{ isHovering, props: hoverProps }">
        <VTextField
          v-bind="hoverProps"
          v-model="searchInput"
          :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
          :class="{ 'mr-6': !isFlat }"
          density="comfortable"
          placeholder="Search by name or id..."
          prepend-inner-icon="mdi-magnify"
          rounded="xl"
          variant="outlined"
          clearable
          hide-details
          @click:clear="resetInput"
        />
      </template>
    </VHover>
    <VBtn
      v-if="!isFlat"
      :disabled="!!props.search"
      color="primary-lighten-3"
      variant="tonal"
      @click="currentRepositoryStore.toggleOutlineExpand"
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
  max-width: 28rem;
  transition: all 1s;
}
</style>
