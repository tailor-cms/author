<!-- eslint-disable vue/no-undef-components -->
<template>
  <VCard class="question-container" color="surface-container-lowest">
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <VCard
        v-bind="hoverProps"
        :height="collapsible ? 48 : 38"
        class="d-flex px-4"
        color="surface-container"
        rounded="0"
        flat
        v-on="{ click: collapsible ? () => emit('selected') : null }"
      >
        <VRow class="w-100" density="compact">
          <VCol :cols="expanded ? 9 : 3" class="text-left align-content-center">
            <div class="d-flex align-center">
              <VIcon :icon="icon" color="secondary" size="small" start />
              <span class="text-title-small">{{ type }}</span>
            </div>
          </VCol>
          <VCol
            v-if="!expanded"
            cols="6"
            class="text-title-small align-content-center text-truncate"
          >
            {{ question }}
          </VCol>
          <VCol cols="3" class="text-right d-flex justify-end align-center">
            <DiffChip :change-type="element.diffChange" />
            <VFadeTransition>
              <div
                v-if="!isDisabled && collapsible && (isHovering || expanded)"
                class="d-flex justify-end ga-1"
              >
                <ElementGeneration
                  v-if="showAI"
                  color="secondary"
                  tooltip-location="bottom"
                  @generate="$emit('generate', $event)"
                />
                <VBtn
                  v-tooltip:bottom="{ text: 'Reset element', openDelay: 1000 }"
                  color="warning"
                  aria-label="Reset element"
                  icon="mdi-restore"
                  size="x-small"
                  variant="tonal"
                  @click.stop="$emit('reset')"
                />
                <VBtn
                  v-tooltip:bottom="{ text: 'Delete element', openDelay: 1000 }"
                  color="error"
                  icon="mdi-trash-can-outline"
                  size="x-small"
                  variant="tonal"
                  @click.stop="$emit('delete')"
                />
              </div>
            </VFadeTransition>
            <VIcon
              v-if="collapsible"
              :icon="`mdi-chevron-${expanded ? 'up' : 'down'}`"
              class="my-1 ml-2"
            />
          </VCol>
        </VRow>
      </VCard>
    </VHover>
    <VExpandTransition>
      <div v-if="expanded">
        <slot></slot>
        <VForm
          ref="form"
          class="content text-left pa-6"
          :validate-on="autosave ? 'input' : 'submit'"
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
              :id="`element_${element.id}`"
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
    </VExpandTransition>
  </VCard>
</template>

<script lang="ts" setup>
import { cloneDeep, isEqual, omit, map } from 'lodash-es';
import { computed, inject, reactive, ref, watch } from 'vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';
import { getQuestionPromptPreview } from '@tailor-cms/utils';

import DiffChip from './DiffChip.vue';
import ElementGeneration from './ElementGeneration.vue';
import QuestionContainer from './QuestionContainer/index.vue';
import { useConfigStore } from '@/stores/config';
import { useValidation } from '../composables/useValidation';

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
  isReadonly?: boolean;
  isFocused?: boolean;
  isDragged?: boolean;
  dense?: boolean;
  collapsible?: boolean;
  isDirty?: boolean;
  expanded?: boolean;
  autosave?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  references: null,
  type: 'Question element',
  icon: 'mdi-help-circle-outline',
  isDisabled: false,
  isReadonly: false,
  isDragged: false,
  isFocused: false,
  dense: false,
  collapsible: false,
  isDirty: false,
  expanded: true,
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
  'selected',
  'generate',
  'reset',
]);

const ceRegistry = inject<any>('$ceRegistry');

const form = ref();
const editedElement = reactive(initializeElement());

const config = useConfigStore();

const manifest = computed(() => ceRegistry.getByEntity(props.element));
const isDirty = computed(() => {
  const dataChanged = !isEqual(editedElement.data, initializeElement().data);
  return dataChanged || props.isDirty;
});

const question = computed(() => {
  const embeds = editedElement.data.embeds as Record<string, ContentElement>;
  const questions = editedElement.data.question as string[];
  return getQuestionPromptPreview(questions.map((it) => embeds[it]));
});

const showAI = computed(() => !!config.props.aiUiEnabled && manifest.value?.ai);

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
