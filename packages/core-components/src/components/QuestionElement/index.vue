<!-- eslint-disable vue/no-undef-components -->
<template>
  <div class="question-container">
    <slot></slot>
    <VForm
      ref="form"
      :validate-on="autosave ? 'input' : 'submit'"
      class="content text-left"
    >
      <QuestionContainer
        :element-data="editedElement.data"
        :embed-element-config="embedElementConfig"
        :is-disabled="isDisabled"
        :is-readonly="isDisabled"
        @update="update"
      >
        <component
          :is="componentName"
          v-bind="{
            ...$attrs,
            embedElementConfig,
            element: editedElement,
            references,
            isFocused,
            isDragged,
            isDisabled,
            isReadonly: props.isDisabled,
            dense,
          }"
          @add="emit('add', $event)"
          @delete="emit('delete')"
          @focus="emit('select', $event)"
          @link="emit('link', $event)"
          @save="save"
          @update="update"
        />
      </QuestionContainer>
      <VFadeTransition>
        <div
          v-if="!isDisabled && isDirty && !autosave"
          class="d-flex justify-end ga-2"
        >
          <VBtn text="Cancel" variant="text" @click="cancel" />
          <VBtn
            color="success"
            prepend-icon="mdi-check"
            text="Save"
            variant="tonal"
            @click="save"
          />
        </div>
      </VFadeTransition>
    </VForm>
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep, isEqual, omit, map } from 'lodash-es';
import { computed, inject, reactive, ref, watch } from 'vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';

import QuestionContainer from './QuestionContainer/index.vue';
import { useValidation } from '../../composables/useValidation';

const isLegacyQuestion = (type: string) => ceRegistry.isLegacyQuestion(type);

const convertLegacyElement = (element: ContentElement) => {
  const question = element.data.question as any[];
  const embeds = question.reduce((acc, question, index) => {
    const position = index + 1;
    const embed = { position, ...question };
    acc[question.id] = embed;
    return acc;
  }, {});
  const type = ceRegistry.getByEntity(element).type;
  const isGradable = element.type === 'ASSESSMENT';
  const data = {
    ...omit(element.data, 'question'),
    question: map(question, 'id'),
    isGradable,
    embeds,
  };
  return { ...element, data, type };
};

const initializeElement = () => {
  const el = cloneDeep(props.element);
  return isLegacyQuestion(el.type) ? convertLegacyElement(el) : el;
};

interface Props {
  element: ContentElement;
  componentName: string;
  references?: Record<string, ContentElement[]> | null;
  embedElementConfig?: ContentElementCategory[];
  isDisabled?: boolean;
  isReadonly?: boolean;
  isFocused?: boolean;
  isDragged?: boolean;
  dense?: boolean;
  isDirty?: boolean;
  autosave?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  references: null,
  isDisabled: false,
  isReadonly: false,
  isDragged: false,
  isFocused: false,
  dense: false,
  isDirty: false,
  autosave: false,
});

const emit = defineEmits([
  'add',
  'cancel',
  'delete',
  'save',
  'select',
  'link',
  'update',
]);

const ceRegistry = inject<any>('$ceRegistry');

const form = ref();
const editedElement = reactive(initializeElement());

const isDirty = computed(() => {
  const dataChanged = !isEqual(editedElement.data, initializeElement().data);
  return dataChanged || props.isDirty;
});

const save = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) return;
  if (isLegacyQuestion(props.element.type)) {
    const data = cloneDeep(editedElement.data);
    const question = data.question as any[];
    return emit('save', {
      ...omit(data, 'embeds', 'question', 'isGradable'),
      question: map(question, (id) => omit(data.embeds[id], 'position')),
      type: props.element.data.type,
    });
  }
  return emit('save', editedElement.data);
};

const validate = async () => {
  if (!form.value) return { valid: true };
  return form.value.validate();
};

const resetValidation = () => {
  if (!form.value) return;
  return form.value.resetValidation();
};

const cancel = () => {
  editedElement.data = initializeElement().data;
};

const update = (data: any) => {
  editedElement.data = { ...editedElement.data, ...data };
  if (props.autosave) emit('save', editedElement.data);
};

watch(
  () => props.element,
  () => {
    if (!isDirty.value) return;
    editedElement.data = initializeElement().data;
  },
);

useValidation(String(props.element.id), validate, resetValidation);
</script>

<style lang="scss" scoped>
:deep(.v-input__control) {
  flex-wrap: wrap;
}
</style>
