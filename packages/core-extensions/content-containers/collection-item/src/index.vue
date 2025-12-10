<template>
  <VCard class="collection-item bg-primary-lighten-5 py-11 px-9">
    <div v-for="input in config" :key="input.key">
      <div v-if="input.isContentElement" class="element-container pb-4">
        <div class="label ma-1 text-caption text-left">{{ input.label }}</div>
        <ContainedContent
          :element="state[input.key]"
          @save="(e) => (state[input.key] = { ...state[input.key], data: e })"
        />
      </div>
      <MetaInput
        v-else
        :meta="{ ...input, value: state[input.key] }"
        :name="input.key"
        @update="(e) => (state[input.key] = e)"
      />
    </div>
    <VCardActions class="d-flex justify-center pt-6 pb-2">
      <VBtn
        class="ma-1 px-15"
        color="primary-darken-4"
        variant="tonal"
        @click="save"
      >
        Save
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<script lang="ts" setup>
import { inject, ref } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity.js';
import type { ContentElement } from '@tailor-cms/interfaces/content-element.js';
import type { Repository } from '@tailor-cms/interfaces/repository.js';
import { pick } from 'lodash-es';
import { uuid } from '@tailor-cms/utils';

import { ContainedContent } from '@tailor-cms/core-components';
import MetaInput from './MetaInput.vue';

const ceRegistry = inject<any>('$ceRegistry');

interface Props {
  repository: Repository;
  activities: Record<string, Activity>;
  container: Activity;
  elements: Record<string, ContentElement>;
  config?: Record<number, any>;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  config: () => ({}),
});

const emit = defineEmits<{ (e: 'update:container', container: any): void }>();

const initElement = (type: string, state: Record<PropertyKey, any> = {}) => {
  const { initState = () => ({}) } = ceRegistry.get(type);
  return {
    id: uuid(),
    type,
    embedded: true,
    data: { width: 12, ...initState(), ...state },
  };
};

const state = ref(
  Object.values(props.config).reduce((acc, it) => {
    acc[it.key] =
      props.container.data?.[it.key] ||
      (it.isContentElement ? initElement(it.type) : it.defaultValue || '');
    return acc;
  }, {}),
);

const save = () => {
  emit('update:container', {
    ...pick(props.container, ['id', 'repositoryId']),
    data: state.value,
  });
};
</script>

<style lang="scss" scoped>
.element-container {
  position: relative;
}

.label {
  opacity: 0.65;
}

.element-container > .contained-content :deep {
  // First level elements cannot be dragged
  > .drag-handle {
    display: none;
  }

  // First level elements cannot be deleted
  > .content-element > .element-actions {
    display: none;
  }

  .content-element.focused {
    border: 1px solid rgb(var(--v-theme-primary-darken-4)) !important;
    border-radius: 3px;

    &::after {
      display: block;
      background: rgb(var(--v-theme-primary-darken-4)) !important;
    }
  }
}
</style>
