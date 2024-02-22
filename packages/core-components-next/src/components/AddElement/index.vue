<template>
  <div class="add-element-container">
    <slot>
      <VBtn
        v-if="large"
        class="mt-3 mb-4"
        color="primary-darken-4"
        variant="text"
        @click.stop="showElementPicker"
      >
        <VIcon class="pr-2">{{ icon }}</VIcon>
        {{ label }}
      </VBtn>
      <VBtn
        v-else
        :icon="icon"
        color="primary-darken-2"
        variant="outlined"
        @click.stop="showElementPicker"
      >
        <VIcon>{{ icon }}</VIcon>
      </VBtn>
    </slot>
    <template v-if="isVisible">
      <!-- <SelectElement
        v-if="showElementBrowser"
        @selected="addElements"
        @close="showElementBrowser = false"
        :allowed-types="allowedTypes"
        submit-label="Copy"
        heading="Copy elements"
        header-icon="mdi-content-duplicate"
        multiple /> -->
      <AddNewElement
        v-model="isVisible"
        :allowed-types="allowedTypes"
        :library="library"
        @add="addElements"
      >
        <template #header>
          <div v-if="layout" class="mr-6 text-primary-lighten-3">
            <div class="pb-2 text-subtitle-2 text-left">Element width</div>
            <VBtnToggle
              v-model="elementWidth"
              class="bg-primary-darken-3"
              color="lime-lighten-2"
              rounded="small"
              variant="tonal"
              divided
              mandatory
            >
              <VBtn :value="100" class="px-8" icon="mdi-square-outline" />
              <VBtn :value="50" class="px-8" icon="mdi-select-compare" />
            </VBtnToggle>
          </div>
          <!-- <VBtn
            class="mt-6"
            color="primary-lighten-4"
            variant="tonal"
            @click="showElementBrowser = !showElementBrowser"
          >
            <VIcon class="mr-2">mdi-content-copy</VIcon>
            Copy existing
          </VBtn> -->
        </template>
      </AddNewElement>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { getPositions, isQuestion, uuid } from '@tailor-cms/utils';
import flatMap from 'lodash/flatMap';
import intersection from 'lodash/intersection';
import pick from 'lodash/pick';
import reduce from 'lodash/reduce';
import reject from 'lodash/reject';

import AddNewElement from './AddNewElement.vue';
// import SelectElement from '../SelectElement/index.vue';

const DEFAULT_ELEMENT_WIDTH = 100;
const LAYOUT = { HALF_WIDTH: 6, FULL_WIDTH: 12 };

const ELEMENT_GROUPS = [
  { name: 'Content Elements', icon: 'mdi-set-center' },
  { name: 'Assessments', icon: 'mdi-help-rhombus' },
  { name: 'Nongraded questions', icon: 'mdi-comment-question-outline' },
];

const getQuestionData = (element, type) => {
  const data = { width: LAYOUT.FULL_WIDTH };
  const question = [{ id: uuid(), data, type: 'JODIT_HTML', embedded: true }];
  return { question, type, ...element.data };
};

const emit = defineEmits(['add', 'hidden']);
const props = defineProps({
  items: { type: Array, required: true },
  activity: { type: Object, default: null },
  position: { type: Number, default: null },
  layout: { type: Boolean, default: true },
  include: { type: Array, default: null },
  show: { type: Boolean, default: false },
  large: { type: Boolean, default: false },
  label: { type: String, default: 'Add content' },
  icon: { type: String, default: 'mdi-plus' },
});

const registry = useNuxtApp().$ceRegistry.all as any[];

const isVisible = ref(false);
const elementWidth = ref(DEFAULT_ELEMENT_WIDTH);
// const showElementBrowser = ref(false);

// Determine if the element picker should show all elements or a subset
const isSubset = computed(() => !!props.include && !!props.include.length);

const contentElements = computed(() => {
  const items = registry.filter((it) => !isQuestion(it.type));
  if (!isSubset.value) return items;
  return items.filter((it) => props.include.includes(it.type));
});

const questions = computed(() =>
  registry.filter((it) => it?.type === 'QUESTION'),
);

const assessments = computed(() => {
  if (isSubset.value && !props.include.includes('ASSESSMENT')) return [];
  return registry
    .filter((it) => it.type === 'ASSESSMENT')
    .concat(questions.value.map((it) => ({ ...it, type: 'ASSESSMENT' })));
});

const reflections = computed(() => {
  if (isSubset.value && !props.include.includes('REFLECTION')) return [];
  return registry
    .filter((it) => it.type === 'REFLECTION')
    .concat(questions.value.map((it) => ({ ...it, type: 'REFLECTION' })));
});

const library = computed(() => {
  const groups = [contentElements.value, assessments.value, reflections.value];
  return reduce(
    groups,
    (acc, elements, i) => {
      if (elements.length) acc.push({ ...ELEMENT_GROUPS[i], elements });
      return acc;
    },
    [],
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

const addElements = (elements) => {
  const positions = getPositions(props.items, props.position, elements.length);
  const items = elements.map((it, index) => {
    return buildElement({ ...it, position: positions[index] });
  });
  emit('add', items);
  isVisible.value = false;
};

const buildElement = (el) => {
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
