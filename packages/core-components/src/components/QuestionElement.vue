<!-- eslint-disable vue/no-undef-components -->
<template>
  <VCard class="question-container" color="grey-lighten-5">
    <VToolbar class="px-4" color="primary-darken-2" height="36">
      <VIcon :icon="icon" color="secondary-lighten-2" size="18" start />
      <span class="text-subtitle-2">{{ type }}</span>
    </VToolbar>
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
import { computed, reactive, ref, watch } from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import sortBy from 'lodash/sortBy';

import { questionType } from '../utils';

const convertLegacyElement = (element: ContentElement) => {
  const question = element.data.question as any[];
  const embeds = question.reduce((acc, question, index) => {
    const position = index + 1;
    const embed = { position, ...question };
    acc[question.id] = embed;
    return acc;
  }, {});
  const type = questionType.get(element.data.type as string);
  const isGradable = element.type === 'ASSESSMENT';
  const data = { ...omit(element.data, 'question'), embeds, isGradable };
  return { ...element, data, type };
};

const initializeElement = () => {
  const element = cloneDeep(props.element);
  return props.isLegacyQuestion ? convertLegacyElement(element) : element;
};

interface Props {
  element: ContentElement;
  componentName: string;
  references?: Record<string, ContentElement[]> | null;
  type?: string;
  icon?: string;
  embedElementConfig?: ContentElementCategory[];
  isLegacyQuestion?: boolean;
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

const form = ref();
const editedElement = reactive(initializeElement());

const isDirty = computed(
  () => !isEqual(editedElement.data, props.element.data),
);

const save = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) return;
  if (!props.isLegacyQuestion) return emit('save', editedElement.data);
  const { embeds, ...data } = cloneDeep(editedElement.data);
  const question = sortBy(embeds, 'position').map((it) => omit(it, 'position'));
  const type = props.element.data.type;
  return emit('save', { ...data, question, type });
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
