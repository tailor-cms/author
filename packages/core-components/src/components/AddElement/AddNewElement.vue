<template>
  <VBottomSheet class="mx-5">
    <div class="element-container bg-primary-lighten-5">
      <div class="d-flex align-end pt-6 pb-5 px-10">
        <slot name="header"></slot>
      </div>
      <div v-for="group in library" :key="group.name" class="mb-2 mx-10">
        <div class="group-heading text-primary-darken-3 mt-3 mb-2">
          {{ group.name }}
        </div>
        <div class="group-elements ga-5">
          <VBtn
            v-for="element in group.items"
            :key="element.position"
            :disabled="!isAllowed(element.type)"
            class="add-element"
            color="primary-darken-3"
            rounded="lg"
            variant="text"
            stacked
            @click.stop="emitAdd(element)"
          >
            <template #prepend>
              <VIcon v-if="element.ui.icon" size="28">
                {{ element.ui.icon }}
              </VIcon>
            </template>
            {{ element.name }}
          </VBtn>
        </div>
      </div>
    </div>
  </VBottomSheet>
</template>

<script lang="ts" setup>
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { some } from 'lodash-es';

const props = defineProps<{ library: any; allowedElementConfig: any[] }>();

const emit = defineEmits(['add']);

const isAllowed = (type: string) => {
  const hasElements = !props.allowedElementConfig.length;
  return hasElements || some(props.allowedElementConfig, { type });
};

const emitAdd = (element: ContentElement) => emit('add', [element]);
</script>

<style lang="scss" scoped>
.element-container {
  min-height: 20rem;
  padding: 0 0 1.875rem;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  overflow: hidden;
}

.group-heading {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1rem;
  text-align: left;
}

.group-elements {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.add-element {
  width: 8.125rem;
  min-width: 8.125rem;
  height: auto !important;
  min-height: 4.75rem;
  padding: 0.5rem 0.375rem !important;

  :deep(.v-btn__content) {
    text-transform: none;
  }

  :deep(.v-btn__prepend) {
    margin-bottom: 0.25rem;
  }
}
</style>
