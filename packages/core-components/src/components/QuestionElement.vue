<!-- eslint-disable vue/no-undef-components -->
<template>
  <VCard class="question-container" color="grey-lighten-5">
    <VToolbar class="px-4" color="primary-darken-2" height="36">
      <VIcon :icon="icon" color="secondary-lighten-2" size="18" start />
      <span class="text-subtitle-2">{{ type }}</span>
    </VToolbar>
    <slot></slot>
    <VForm ref="form" class="content text-left pa-6" validate-on="submit">
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
          dense,
        }"
        :id="`element_${element.id}`"
        @add="emit('add', $event)"
        @delete="emit('delete')"
        @focus="emit('select', $event)"
        @link="emit('link', $event)"
        @save="save"
        @update="Object.assign(editedElement.data, $event)"
      />
      <VFadeTransition>
        <div v-if="!isDisabled && isDirty" class="d-flex justify-end">
          <VBtn color="primary-darken-4" variant="text" @click="cancel">
            Cancel
          </VBtn>
          <VBtn
            class="ml-2"
            color="success"
            prepend-icon="mdi-check"
            variant="tonal"
            @click="save"
          >
            Save
          </VBtn>
        </div>
      </VFadeTransition>
    </VForm>
  </VCard>
</template>

<script lang="ts" setup>
import { computed, inject, reactive, ref, watch } from 'vue';
import { cloneDeep, isEqual, omit, map } from 'lodash-es';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';

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
  type?: string;
  icon?: string;
  embedElementConfig?: ContentElementCategory[];
  isDisabled?: boolean;
  isFocused?: boolean;
  isDragged?: boolean;
  dense?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  references: null,
  type: 'Question element',
  icon: 'mdi-help-circle-outline',
  isDisabled: false,
  isDragged: false,
  isFocused: false,
  dense: false,
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

const isDirty = computed(
  () => !isEqual(editedElement.data, initializeElement().data),
);

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

const cancel = () => {
  editedElement.data = initializeElement().data;
};

watch(
  () => props.element,
  () => {
    if (!isDirty.value) return;
    editedElement.data = initializeElement().data;
  },
);
</script>

<style lang="scss" scoped>
:deep(.v-input__control) {
  flex-wrap: wrap;
}
</style>
