<!-- eslint-disable vue/no-undef-components -->
<template>
  <VCard class="question-container" color="grey-lighten-5">
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <VCard
        v-bind="hoverProps"
        :color="expanded ? 'primary-darken-2' : 'primary-lighten-5'"
        :height="collapsible ? 48 : 38"
        class="d-flex px-4"
        rounded="0"
        flat
        v-on="{ click: collapsible ? () => emit('selected') : null }"
      >
        <VRow class="w-100" dense>
          <VCol :cols="expanded ? 9 : 3" class="text-left align-content-center">
            <div class="d-flex align-center">
              <VIcon
                :icon="icon"
                color="secondary-lighten-2"
                size="small"
                start
              />
              <span class="text-subtitle-2">{{ type }}</span>
            </div>
          </VCol>
          <VCol
            v-if="!expanded"
            cols="6"
            class="text-subtitle-2 align-content-center text-truncate"
          >
            {{ question }}
          </VCol>
          <VCol cols="3" class="text-right d-flex justify-end align-center">
            <PublishDiffChip
              v-if="editorState.isPublishDiff && element.changeSincePublish"
              :change-type="publishDiffChangeType"
            />
            <VFadeTransition>
              <div
                v-if="!isDisabled && collapsible && (isHovering || expanded)"
                class="d-flex justify-end ga-1"
              >
                <ElementGeneration
                  v-if="showAI"
                  :color="`indigo${expanded ? '-lighten-3' : ''}`"
                  @generate="$emit('generate', $event)"
                />
                <VTooltip location="left" open-delay="1000">
                  <template #activator="{ props: tooltipProps }">
                    <VBtn
                      v-bind="tooltipProps"
                      :color="`teal${expanded ? '-lighten-3' : ''}`"
                      aria-label="Reset element"
                      icon="mdi-restore"
                      size="x-small"
                      variant="tonal"
                      @click.stop="$emit('reset')"
                    />
                  </template>
                  Reset element
                </VTooltip>
                <VBtn
                  :color="`secondary${expanded ? '-lighten-3' : ''}`"
                  icon="mdi-delete-outline"
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
          validate-on="submit"
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
          <VFadeTransition>
            <div
              v-if="!isDisabled && isDirty && !autoSave"
              class="d-flex justify-end"
            >
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
import type { PublishDiffChangeTypes } from '@tailor-cms/utils';

import ElementGeneration from './ElementGeneration.vue';
import PublishDiffChip from './PublishDiffChip.vue';
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
  autoSave?: boolean;
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
  autoSave: false,
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
const editorState = inject<any>('$editorState');

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

const publishDiffChangeType = computed(() =>
  props.element.changeSincePublish as PublishDiffChangeTypes);

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

const cancel = () => {
  editedElement.data = initializeElement().data;
};

const update = (data: any) => {
  Object.assign(editedElement.data, data);
  if (props.autoSave) emit('save', { ...editedElement.data });
};

watch(
  () => props.element,
  () => {
    if (!isDirty.value) return;
    editedElement.data = initializeElement().data;
  },
);

useValidation(String(props.element.id), validate);
</script>

<style lang="scss" scoped>
:deep(.v-input__control) {
  flex-wrap: wrap;
}
</style>
