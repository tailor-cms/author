<template>
  <VCard color="white" class="ccollection-item mb-5">
    <VCardText class="text-left pa-8 pb-4">
      <div v-for="input in config" :key="input.key">
        <Field
          v-if="input.isContentElement"
          v-slot="{ errorMessage }"
          :name="input.key"
          :rules="required(input.type, input.label)"
          :model-value="state[input.key].data"
          :validate-on-model-update="false"
          validate-on-input
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
              auto-save
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
          @update="(e) => (state[input.key] = e)"
        />
      </div>
    </VCardText>
    <VCardActions v-if="isDirty" class="d-flex justify-center pt-0 pb-12">
      <VBtn
        class="px-15"
        color="primary-darken-4"
        variant="tonal"
        @click="save"
      >
        Save {{ startCase(repository.schema) }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity.js';
import type { ContentElement } from '@tailor-cms/interfaces/content-element.js';
import type { Repository } from '@tailor-cms/interfaces/repository.js';
import { cloneDeep, isEqual, pick, startCase } from 'lodash-es';
import { Field, useForm } from 'vee-validate';
import { uuid } from '@tailor-cms/utils';

import { ContainedContent, useValidationProvider } from '@tailor-cms/core-components';
import MetaInput from './MetaInput.vue';
import { required } from './isEmpty';

const { validate } = useForm();
const { validate: validateItems } = useValidationProvider();

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

const initElement = (type: string, data: Record<PropertyKey, any> = {}) => {
  const { initState = () => ({}) } = ceRegistry.get(type);
  return {
    id: uuid(),
    type,
    embedded: true,
    data: { width: 12, ...initState(), ...data },
  };
};

const initState = () =>
  Object.values(props.config).reduce((acc: Record<string, any>, it) => {
    acc[it.key] =
      props.container.data?.[it.key] ||
      (it.isContentElement ? initElement(it.type) : it.defaultValue || '');
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
</script>

<style lang="scss" scoped>
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
