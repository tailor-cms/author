<template>
  <div class="add-element-container">
    <slot :add-element="showElementPicker">
      <VBtn
        v-if="large"
        :color="color"
        :variant="variant"
        @click.stop="showElementPicker"
      >
        <VIcon class="pr-3">{{ icon }}</VIcon>
        {{ label }}
      </VBtn>
      <VBtn
        v-else
        :icon="icon"
        color="primary-darken-2"
        size="small"
        variant="tonal"
        @click.stop="showElementPicker"
      >
        <VIcon>{{ icon }}</VIcon>
      </VBtn>
    </slot>
    <template v-if="isVisible">
      <SelectElement
        v-if="showElementBrowser"
        :allowed-element-config="allowedElementConfig"
        header-icon="mdi-content-duplicate"
        heading="Copy elements"
        submit-label="Copy"
        multiple
        @close="showElementBrowser = false"
        @selected="addElements"
      />
      <AddNewElement
        v-model="isVisible"
        v-bind="{ allowedElementConfig, isAiGeneratingContent, library }"
        @add="addElements"
      >
        <template #header>
          <VBtn
            :disabled="useAI"
            color="primary-darken-3"
            variant="tonal"
            prepend-icon="mdi-content-copy"
            text="Copy existing"
            @click="showElementBrowser = !showElementBrowser"
          />
          <VSpacer />
          <div v-if="layout" class="d-flex align-center ga-4">
            <span class="text-subtitle-1 text-medium-emphasis">
              Element width
            </span>
            <VBtnToggle
              v-model="elementWidth"
              density="compact"
              variant="outlined"
              divided
              mandatory
            >
              <VBtn v-tooltip:bottom="'Full width'" :value="100" size="small">
                <VIcon size="18">mdi-square-outline</VIcon>
              </VBtn>
              <VBtn v-tooltip:bottom="'Half width'" :value="50" size="small">
                <VIcon size="18">mdi-select-compare</VIcon>
              </VBtn>
            </VBtnToggle>
          </div>
          <VBtn
            v-if="doTheMagic"
            :color="useAI ? 'indigo-darken-2' : 'primary-darken-3'"
            :variant="useAI ? 'flat' : 'tonal'"
            :prepend-icon="useAI ? 'mdi-creation' : 'mdi-creation-outline'"
            text="Generate with AI"
            @click="useAI = !useAI"
          />
          <VExpandTransition>
            <div v-if="useAI" class="w-100 mt-4">
              <VTextarea
                v-model="aiPrompt"
                density="comfortable"
                placeholder="Describe the content you want to generate..."
                rows="2"
                variant="solo"
                auto-grow
                hide-details
                flat
              />
            </div>
          </VExpandTransition>
        </template>
      </AddNewElement>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import { filter, flatMap, pick, reject } from 'lodash-es';
import { getPositions, uuid } from '@tailor-cms/utils';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';
import type { VBtn } from 'vuetify/components';

import SelectElement from '../SelectElement/index.vue';
import AddNewElement from './AddNewElement.vue';
import { AiRequestType } from '@tailor-cms/interfaces/ai';

const DEFAULT_GROUP = 'Content Elements';
const DEFAULT_ELEMENT_WIDTH = 100;
const LAYOUT = { HALF_WIDTH: 6, FULL_WIDTH: 12 };

interface Props {
  items: ContentElement[];
  position: number;
  activity?: Activity | null;
  layout?: boolean;
  include?: ContentElementCategory[] | null;
  show?: boolean;
  large?: boolean;
  label?: string;
  icon?: string;
  color?: string;
  variant?: VBtn['variant'];
}

const props = withDefaults(defineProps<Props>(), {
  activity: null,
  layout: true,
  include: null,
  show: false,
  large: false,
  label: 'Add content',
  icon: 'mdi-plus',
  color: 'primary-darken-4',
  variant: 'tonal',
});
const emit = defineEmits(['add', 'hidden']);

const ceRegistry = inject<any>('$ceRegistry');

const useAI = ref(false);
const aiPrompt = ref('');
const doTheMagic = inject<any>('$doTheMagic');
const isAiGeneratingContent = ref(false);
const isVisible = ref(false);
const elementWidth = ref(DEFAULT_ELEMENT_WIDTH);
const showElementBrowser = ref(false);

// Determine if the element picker should show all elements or a subset
const isSubset = computed(() => !!props.include && !!props.include.length);

const library = computed(() => {
  if (!isSubset.value) return [{ name: DEFAULT_GROUP, items: ceRegistry.all }];
  return props.include?.map((group) => {
    const items = group.items.map(({ id, ...config }) => {
      return { ...ceRegistry.get(id), config };
    });
    return { ...group, items };
  });
});

const processedWidth = computed(() => {
  return elementWidth.value === 50 ? LAYOUT.HALF_WIDTH : LAYOUT.FULL_WIDTH;
});

const allowedElementConfig = computed(() => {
  const elements = flatMap(library.value, 'items');
  const isFullWidth = elementWidth.value === DEFAULT_ELEMENT_WIDTH;
  const aiFiltered = useAI.value ? filter(elements, 'ai') : elements;
  const allowedElements = isFullWidth
    ? aiFiltered
    : reject(aiFiltered, 'ui.forceFullWidth');
  return allowedElements.map(({ type, config }) => ({ type, config }));
});

const addElements = async (elements: any[]) => {
  const positions = getPositions(props.items, props.position, elements.length);
  const items = await Promise.all(elements.map((it, index: number) => {
    return buildElement({ ...it, position: positions[index] });
  }));
  emit('add', items);
  isVisible.value = false;
};

const generateContent = async (element: ContentElement) => {
  isAiGeneratingContent.value = true;
  const input = {
    type: AiRequestType.Create,
    text: aiPrompt.value.trim() ?? 'Generate content element for this page.',
    responseSchema: element.type,
  };
  const data = await doTheMagic({
    containerType: props.activity?.type,
    inputs: [input],
  });
  isAiGeneratingContent.value = false;
  return data;
};

const buildElement = async (el: any) => {
  const { position, data = {}, initState = () => ({}), config } = el;
  const element = {
    ...pick(el, ['type', 'refs']),
    data: { ...initState(), ...data, width: processedWidth.value },
    position,
  };
  if (useAI.value) {
    const data = await generateContent(el);
    Object.assign(element.data, data);
    const contextData = props.activity
      ? { activityId: props.activity.id } // If content element within activity
      : { id: uuid(), embedded: true }; // If embed, assign id
    Object.assign(element, contextData);
    return element;
  }
  if (!el.data && el.isQuestion) {
    const id = uuid();
    const question = {
      id,
      data: { content: '' },
      type: 'TIPTAP_HTML',
      position: 1,
      embedded: true,
    };
    const isGradable = config?.isGradable ?? el.isGradable ?? true;
    Object.assign(element.data, {
      embeds: { [id]: question },
      question: [id],
      isGradable,
    });
    if (!isGradable) delete element.data.correct;
  }
  const contextData = props.activity
    ? { activityId: props.activity.id } // If content element within activity
    : { id: uuid(), embedded: true }; // If embed, assign id
  Object.assign(element, contextData);
  return element;
};

const onHidden = () => {
  elementWidth.value = DEFAULT_ELEMENT_WIDTH;
  emit('hidden');
};

const showElementPicker = () => {
  isVisible.value = true;
};

watch(isVisible, (val, oldVal) => {
  if (!val && oldVal) onHidden();
});

watch(
  () => props.show,
  (val) => {
    return val ? showElementPicker() : onHidden();
  },
);
</script>
