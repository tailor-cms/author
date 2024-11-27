<template>
  <div class="add-element-container">
    <slot>
      <VBtn
        v-if="large"
        :color="color"
        :variant="variant"
        class="mt-3 mb-4"
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
        :allowed-types="allowedTypes"
        header-icon="mdi-content-duplicate"
        heading="Copy elements"
        submit-label="Copy"
        multiple
        @close="showElementBrowser = false"
        @selected="addElements"
      />
      <AddNewElement
        v-model="isVisible"
        :allowed-types="allowedTypes"
        :library="library"
        @add="addElements"
      >
        <template #header>
          <div v-if="layout" class="mr-6 text-primary-darken-4">
            <div class="pb-2 text-subtitle-2 text-left">Element width</div>
            <VBtnToggle
              v-model="elementWidth"
              color="primary-darken-3"
              rounded="small"
              variant="tonal"
              divided
              mandatory
            >
              <VBtn :value="100" class="px-8" icon="mdi-square-outline" />
              <VBtn :value="50" class="px-8" icon="mdi-select-compare" />
            </VBtnToggle>
          </div>
          <VBtn
            class="mt-8"
            color="primary-darken-3"
            prepend-icon="mdi-content-copy"
            variant="tonal"
            @click="showElementBrowser = !showElementBrowser"
          >
            Copy existing
          </VBtn>
        </template>
      </AddNewElement>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import { getPositions, isQuestion, uuid } from '@tailor-cms/utils';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ElementCategory } from '@tailor-cms/interfaces/schema';
import flatMap from 'lodash/flatMap';
import intersection from 'lodash/intersection';
import map from 'lodash/map';
import pick from 'lodash/pick';
import reject from 'lodash/reject';
import type { VBtn } from 'vuetify/components';

import SelectElement from '../SelectElement/index.vue';
import AddNewElement from './AddNewElement.vue';

const DEFAULT_ELEMENT_WIDTH = 100;
const LAYOUT = { HALF_WIDTH: 6, FULL_WIDTH: 12 };

const DEFAULT_CATEGORY = { name: 'Content Elements' };

const getQuestionData = (element: any, type: string) => {
  const data = { width: LAYOUT.FULL_WIDTH };
  const question = [{ id: uuid(), data, type: 'JODIT_HTML', embedded: true }];
  return { question, type, ...element.data };
};

interface Props {
  items: ContentElement[];
  position: number;
  activity?: Activity | null;
  layout?: boolean;
  include?: string[] | null;
  categories?: ElementCategory[] | null;
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
  categories: null,
  show: false,
  large: false,
  label: 'Add content',
  icon: 'mdi-plus',
  color: 'primary-darken-4',
  variant: 'tonal',
});
const emit = defineEmits(['add', 'hidden']);

const registry = inject<any>('$ceRegistry').all as any[];

const isVisible = ref(false);
const elementWidth = ref(DEFAULT_ELEMENT_WIDTH);
const showElementBrowser = ref(false);

// Determine if the element picker should show all elements or a subset
const isSubset = computed(() => !!props.include && !!props.include.length);

const contentElements = computed(() => {
  if (!isSubset.value) return registry;
  return map(props.include, (it) => registry.find((item) => item.type === it));
});

const library = computed(() => {
  return Object.values(
    contentElements.value.reduce((acc, element) => {
      const { name } =
        props.categories?.find((it) => it.types.includes(element.type)) ||
        DEFAULT_CATEGORY;
      if (acc[name]) acc[name].elements.push(element);
      else acc[name] = { name, elements: [element] };
      return acc;
    }, {} as any),
  );
});

const processedWidth = computed(() => {
  return elementWidth.value === 50 ? LAYOUT.HALF_WIDTH : LAYOUT.FULL_WIDTH;
});

const allowedTypes = computed(() => {
  const elements = flatMap(library.value, 'elements');
  if (!props.layout) return props.include || [];
  const allowedElements =
    elementWidth.value === DEFAULT_ELEMENT_WIDTH
      ? elements
      : reject(elements, 'ui.forceFullWidth');
  const allowedTypes = allowedElements.map((it) => it.type);
  return props.include
    ? intersection(props.include, allowedTypes)
    : allowedTypes;
});

const addElements = (elements: any[]) => {
  const positions = getPositions(props.items, props.position, elements.length);
  const items = elements.map((it, index: number) => {
    return buildElement({ ...it, position: positions[index] });
  });
  emit('add', items);
  isVisible.value = false;
};

const buildElement = (el: any) => {
  const { position, subtype, data = {}, initState = () => ({}) } = el;
  const element = {
    position,
    ...pick(el, ['type', 'refs']),
    data: { ...initState(), ...data, width: processedWidth.value },
  };
  const contextData = props.activity
    ? { activityId: props.activity.id } // If content element within activity
    : { id: uuid(), embedded: true }; // If embed, assign id
  Object.assign(element, contextData);
  if (isQuestion(element.type))
    element.data = getQuestionData(element, subtype);
  if (element.type === 'REFLECTION') delete element.data.correct;
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
