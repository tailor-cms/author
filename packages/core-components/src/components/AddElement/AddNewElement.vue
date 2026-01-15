<template>
  <VBottomSheet class="mx-sm-5">
    <div class="element-container bg-primary-lighten-5">
      <div class="d-flex flex-wrap align-end pt-6 pb-5 px-10 ga-6">
        <slot name="header"></slot>
      </div>
      <VFadeTransition>
        <VSheet
          v-if="isAiGeneratingContent"
          class="generation-loader text-subtitle-2 rounded-lg text-center"
          color="primary-lighten-5"
        >
          <CircularProgress />
          <div class="pt-3 text-primary-darken-4 font-weight-bold">
            <span>Content generation in progress...</span>
          </div>
        </VSheet>
      </VFadeTransition>
      <div v-for="group in library" :key="group.name" class="mb-6">
        <div class="group-heading text-primary-darken-3 my-4 mx-10">
          {{ group.name }}
        </div>
        <div v-if="smAndUp" class="group-elements d-flex ga-5 mx-10">
          <ElementBtn
            v-for="element in group.items"
            :key="element.position"
            :element="element"
            :disabled="!isAllowed(element.type)"
            @click="emitAdd(element)"
          />
        </div>
        <VSlideGroup v-else show-arrows>
          <VSlideGroupItem
            v-for="element in group.items"
            :key="element.position"
          >
            <ElementBtn
              :element="element"
              :disabled="!isAllowed(element.type)"
              class="mr-5"
              border
              @click="emitAdd(element)"
            />
          </VSlideGroupItem>
        </VSlideGroup>
      </div>
    </div>
  </VBottomSheet>
</template>

<script lang="ts" setup>
import CircularProgress from '../CircularProgress.vue';
import ElementBtn from './ElementBtn.vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { some } from 'lodash-es';
import { useDisplay } from 'vuetify';
import { VFadeTransition } from 'vuetify/components';

const { smAndUp } = useDisplay();

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

const emitAdd = (element: ContentElement) => emit('add', [element]);
</script>

<style lang="scss" scoped>
.element-container {
  min-height: 20rem;
  max-height: 80vh;
  padding: 0 0 1.875rem;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  overflow-y: auto;
}

.group-heading {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1rem;
  text-align: left;
}

.group-elements {
  flex-wrap: wrap;
}

.generation-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
