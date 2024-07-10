<template>
  <VBottomSheet class="mx-5">
    <div class="element-container bg-primary-lighten-5">
      <div class="d-flex align-center pt-6 pb-5 px-10">
        <slot name="header"></slot>
      </div>
      <div v-for="group in library as any" :key="group.name" class="mb-2">
        <div class="group-heading text-primary-darken-3">
          {{ group.name }}
        </div>
        <div class="group-elements">
          <span v-for="element in group.elements" :key="element.position">
            <VHover>
              <template #default="{ isHovering, props: hoverProps }">
                <VBtn
                  v-bind="hoverProps"
                  :color="isHovering ? 'primary-darken-4' : 'primary-darken-3'"
                  :disabled="!isAllowed(element.type)"
                  class="add-element mr-5"
                  rounded="lg"
                  variant="tonal"
                  @click.stop="emitAdd(element)"
                >
                  <div class="d-flex flex-column align-center justify-center">
                    <VIcon v-if="element.ui.icon" class="pt-4" size="28">
                      {{ element.ui.icon }}
                    </VIcon>
                    <div class="button-text body-2">{{ element.name }}</div>
                  </div>
                </VBtn>
              </template>
            </VHover>
          </span>
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
  min-height: 4.375rem;
  padding: 0 !important;
  white-space: normal;

  :deep(.v-btn__content) {
    flex: 1 1 100%;
    flex-direction: column;
    padding: 0.375rem;
    text-transform: none;
  }

  .v-icon {
    padding: 0.125rem 0;
    font-size: 1.875rem;
  }

  .button-text {
    margin: 0.625rem 0;
  }
}
</style>
