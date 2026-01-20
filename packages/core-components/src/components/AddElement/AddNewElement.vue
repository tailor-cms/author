<template>
  <VBottomSheet class="mx-sm-5" max-width="1200">
    <VSheet class="element-container" color="primary-lighten-5">
      <div class="picker-header py-6 px-10">
        <VTextField
          v-model="searchQuery"
          class="mb-5"
          density="comfortable"
          placeholder="Search elements..."
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          hide-details
          clearable
          flat
        />
        <div class="d-flex flex-wrap align-center ga-4">
          <slot name="header"></slot>
        </div>
      </div>
      <VFadeTransition>
        <VSheet
          v-if="isAiGeneratingContent"
          class="generation-loader text-subtitle-2 rounded-lg text-center"
          color="primary-lighten-5"
        >
          <CircularProgress />
          <div class="pt-3 text-primary-darken-4 font-weight-bold">
            Content generation in progress...
          </div>
        </VSheet>
      </VFadeTransition>
      <VSheet
        class="overflow-y-auto px-10 pb-8"
        color="transparent"
        max-height="60vh"
      >
        <div v-if="searchQuery && !filteredLibrary.length" class="text-center py-10">
          <VAvatar class="mb-4" size="80" color="primary-lighten-4">
            <VIcon icon="mdi-magnify" size="40" />
          </VAvatar>
          <p class="text-h6">No elements found</p>
          <p class="text-subtitle-1 text-medium-emphasis">
            No elements match "{{ searchQuery }}"
          </p>
        </div>
        <div
          v-for="(group) in filteredLibrary"
          :key="group.name"
          class="element-group"
        >
          <h3 class="text-overline mb-2">{{ group.name }}</h3>
          <div class="element-grid">
            <ElementBtn
              v-for="(element) in group.items"
              :key="element.position"
              :element="element"
              :disabled="!isAllowed(element.type)"
              @click="emitAdd(element)"
            />
          </div>
        </div>
      </VSheet>
    </VSheet>
  </VBottomSheet>
</template>

<script lang="ts" setup>
import CircularProgress from '../CircularProgress.vue';
import ElementBtn from './ElementBtn.vue';
import { computed, ref } from 'vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { some } from 'lodash-es';
import { VFadeTransition } from 'vuetify/components';

const searchQuery = ref('');

const props = defineProps<{
  library: any;
  allowedElementConfig: any[];
  isAiGeneratingContent: boolean;
}>();

const emit = defineEmits(['add']);

const isAllowed = (type: string) => {
  const hasElements = !props.allowedElementConfig.length;
  return hasElements || some(props.allowedElementConfig, { type });
};

const filteredLibrary = computed(() => {
  const query = searchQuery.value?.toLowerCase().trim();
  if (!query) return props.library;
  return props.library
    .map((group: any) => ({
      ...group,
      items: group.items.filter((el: any) =>
        el.name.toLowerCase().includes(query),
      ),
    }))
    .filter((group: any) => group.items.length > 0);
});

const emitAdd = (element: ContentElement) => emit('add', [element]);
</script>

<style lang="scss" scoped>
.element-container {
  position: relative;
}

.element-group {
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.element-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
  gap: 0.75rem;
}

.generation-loader {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
