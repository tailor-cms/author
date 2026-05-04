<template>
  <VCard color="white" class="collection-item">
    <VCardText class="text-left pa-8 pb-4">
      <div v-for="input in config" :key="input.key">
        <Field
          v-if="input.isContentElement"
          v-slot="{ errorMessage }"
          :name="input.key"
          :rules="required(input.type, input.label)"
          :model-value="state[input.key].data"
        >
          <div
            class="label ma-1 text-caption text-left"
            :class="{ 'text-error': errorMessage }">
            {{ input.label }}
          </div>
          <div
            class="element-container pb-4"
            :class="{ 'text-error': errorMessage }"
          >
            <ContainedContent
              :element="state[input.key]"
              :is-disabled="disabled"
              :embed-element-config="embedElementConfig"
              autosave
              @save="(e) => (state[input.key] = { ...state[input.key], data: e })"
            />
            <div v-if="errorMessage" class="v-messages">
              <div class="v-messages__message pl-4">
                {{ errorMessage }}
              </div>
            </div>
          </div>
        </Field>
        <MetaInput
          v-else
          :meta="{ ...input, value: state[input.key] }"
          :name="input.key"
          :is-disabled="disabled"
          hide-details="auto"
          class="pb-4"
          @update="(e) => (state[input.key] = e)"
        />
      </div>
    </VCardText>
    <VDivider />
    <VFadeTransition>
      <VCardActions v-if="!disabled" class="px-6 py-3 justify-end">
        <VBtn
          :disabled="!isDirty"
          :slim="false"
          color="primary-darken-3"
          variant="text"
          @click="reset"
        >
          Cancel
        </VBtn>
        <VBtn
          :disabled="!isDirty"
          :slim="false"
          color="success"
          variant="tonal"
          @click="save"
        >
          Save {{ startCase(repository.schema) }}
        </VBtn>
      </VCardActions>
    </VFadeTransition>
  </VCard>
</template>

<script lang="ts" setup>
import { computed, inject, nextTick, ref } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity.js';
import type { ContentElement } from '@tailor-cms/interfaces/content-element.js';
import type { Repository } from '@tailor-cms/interfaces/repository.js';
import { cloneDeep, isEqual, pick, startCase } from 'lodash-es';
import { Field, useForm } from 'vee-validate';
import { uuid } from '@tailor-cms/utils';

import { ContainedContent, useValidationProvider } from '@tailor-cms/core-components';
import MetaInput from './MetaInput.vue';

const { validate, resetForm } = useForm();
const { validate: validateItems, reset: resetItems } = useValidationProvider();

const ceRegistry = inject<any>('$ceRegistry');

const required = (type: string, label: string) => (data: unknown) => {
  const isEmpty = ceRegistry.get(type)?.isEmpty;
  return isEmpty?.(data) ? `${label} is a required field` : true;
};

interface Props {
  repository: Repository;
  activities: Record<string, Activity>;
  container: Activity;
  elements: Record<string, ContentElement>;
  config?: Record<number, any>;
  embedElementConfig?: any[];
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  config: () => ({}),
  embedElementConfig: () => [],
});

const emit = defineEmits<{ (e: 'update:container', container: any): void }>();

const initElement = (it: any, data: Record<PropertyKey, any> = {}) => {
  const { type, isGradable } = it;
  const { initState = () => ({}), isQuestion } = ceRegistry.get(type);
  const element = {
    id: uuid(),
    type,
    embedded: true,
    data: { width: 12, ...initState(), ...data },
  };
  if (isQuestion) {
    const id = uuid();
    const question = {
      id,
      data: { content: '' },
      type: 'TIPTAP_HTML',
      position: 1,
      embedded: true,
    };
    Object.assign(element.data, {
      embeds: { [id]: question },
      question: [id],
      isGradable,
    });
    if (!isGradable) delete element.data.correct;
  }
  return element;
};

const initState = () =>
  Object.values(props.config).reduce((acc: Record<string, any>, it) => {
    acc[it.key] =
      props.container.data?.[it.key] ||
      (it.isContentElement ? initElement(it) : it.defaultValue || '');
    return acc;
  }, {});

const initialState = ref(initState());
const state = ref(cloneDeep(initialState.value));

const isDirty = computed(() => !isEqual(state.value, initialState.value));

const save = async () => {
  const [formResult, contentResult] = await Promise.all([
    validate(),
    validateItems(),
  ]);
  if (!formResult.valid || !contentResult.valid) return;
  emit('update:container', {
    ...pick(props.container, ['id', 'repositoryId']),
    data: state.value,
  });
  initialState.value = cloneDeep(state.value);
};

const reset = async () => {
  state.value = cloneDeep(initialState.value);
  resetForm();
  await nextTick();
  resetItems();
};
</script>

<style lang="scss" scoped>
.collection-item {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - var(--v-layout-top) - var(--v-layout-bottom) - 8rem);
}

.v-card-text {
  overflow-y: auto;
  min-height: 0;
}

.element-container {
  position: relative;
}

.label {
  opacity: 0.65;

  &.text-error {
    opacity: 1;
  }
}

.element-container > :deep(.contained-content) {
  // First level elements cannot be dragged
  > .drag-handle {
    display: none;
  }

  // First level elements cannot be deleted
  > .content-element > .element-actions {
    display: none;
  }

  > .content-element {
    border: none;
    position: relative;
    border-radius: 4px;

    &.frame {
      padding: 1rem;

      .tiptap {
        padding: 0;
      }
    }

    &::after {
      background: none;
      display: block;
      content: '';
      position: absolute;
      height: 100%;
      left: 0;
      top: 0;
      width: 100%;
      border: 1px solid currentColor;
      opacity: 0.38;
      pointer-events: none;
      border-radius: inherit;
      transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    &.focused::after {
      opacity: 1;
      border-width: 2px;
    }

    &:hover::after {
      opacity: 0.87;
    }
  }
}

.element-container.text-error {
  > :deep(.contained-content) > .content-element::after {
    opacity: 1;
  }

  > .v-messages {
    opacity: 1;
  }
}
</style>
