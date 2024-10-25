<template>
  <VBottomSheet class="mx-5">
    <div class="element-container bg-primary-lighten-5">
      <div class="d-flex align-center pt-6 pb-5 px-10">
        <slot name="header"></slot>
      </div>
      <div v-for="group in library as any" :key="group.name" class="mb-2">
        <div class="group-heading text-primary-darken-3">{{ group.name }}</div>
        <div class="group-elements ga-5">
          <VHover
            v-for="element in group.elements"
            :key="element.position"
            v-slot="{ isHovering, props: hoverProps }"
          >
            <VBtn
              v-bind="hoverProps"
              :color="isHovering ? 'primary-darken-4' : 'primary-darken-3'"
              :disabled="!isAllowed(element.type)"
              class="add-element"
              rounded="lg"
              variant="tonal"
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
          </VHover>
        </div>
      </div>
    </div>
  </VBottomSheet>
</template>

<script lang="ts" setup>
import type { ContentElement } from '@tailor-cms/interfaces/content-element';

const props = defineProps<{ library: any[]; allowedTypes: string[] }>();

const emit = defineEmits(['add']);

const isAllowed = (type: string) => {
  return !props.allowedTypes.length || props.allowedTypes.includes(type);
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
  margin: 0 2.5rem 0.75rem;
  padding-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1rem;
  text-align: left;
}

.group-elements {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  padding: 0 2.25rem;
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
