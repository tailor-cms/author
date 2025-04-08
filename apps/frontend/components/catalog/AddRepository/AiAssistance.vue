<template>
  <VSwitch
    v-model="isAssistaceEnabled"
    :disabled="!schemaId || !name || !description"
    color="primary-darken-2"
    label="AI assisted"
  >
    <template #label>
      AI assisted
      <VProgressCircular
        v-if="isFetchingData && !topicTagOptions.length"
        class="ml-4"
        color="primary-darken-3"
        size="18"
        indeterminate
      />
    </template>
  </VSwitch>
  <div v-if="isAssistaceEnabled" class="ai-panel">
    <div v-if="topicTagOptions.length">
      <div class="mb-4 text-body-2 font-weight-bold">
        Tell us more about the topics you are interested in:
      </div>
      <VChipGroup v-model="selectedTopicTags" column multiple>
        <VChip
          v-for="chip in topicTagOptions"
          :key="chip"
          class="mr-2 mb-2"
          variant="outlined"
          filter
        >
          {{ chip }}
        </VChip>
      </VChipGroup>
      <VBtn
        v-if="topicTagOptions.length && !styleTagOptions.length"
        :loading="isFetchingData"
        class="mt-3 mb-3"
        color="primary-darken-2"
        variant="tonal"
        block
        @click="fetchStyle"
      >
        Next
      </VBtn>
    </div>
    <div v-if="styleTagOptions.length">
      <div class="my-4 text-body-2 font-weight-bold">
        Select a perspectives you are interested in:
      </div>
      <VChipGroup v-model="selectedStyleTags" column multiple>
        <VChip
          v-for="chip in styleTagOptions"
          :key="chip"
          class="mr-2 mb-2"
          variant="outlined"
          filter
        >
          {{ chip }}
        </VChip>
      </VChipGroup>
      <div class="mt-5 mb-4 text-body-2 font-weight-bold">Audience:</div>
      <VSlider
        v-model="selectedDifficulty"
        :step="1"
        :ticks="difficultyOptions"
        class="mb-6"
        color="primary-darken-2"
        max="2"
        min="0"
        show-ticks="always"
        tick-size="0"
      />
      <VBtn
        v-if="styleTagOptions.length && !outlineTree.length"
        :loading="isFetchingData"
        class="mt-3 mb-3"
        color="primary-darken-2"
        variant="tonal"
        block
        @click="fetchOutline"
      >
        Next
      </VBtn>
    </div>
    <template v-if="outlineTree.length">
      <div class="my-4 text-body-2 font-weight-bold">Suggested outline:</div>
      <VueTreeView
        :hide-guide-lines="false"
        :is-checkable="false"
        :items="outlineTree"
        class="explorer-container mb-8"
      />
    </template>
    <div v-if="statusMessage" class="my-7 text-body-2 text-center">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AiContext, AiInput } from '@tailor-cms/interfaces/ai';
import {
  AiResponseSchema,
  AiRequestType,
  AiTargetAudience,
} from '@tailor-cms/interfaces/ai';

import VueTreeView from 'vue3-tree-vue';
import aiAPI from '@/api/ai';

const props = defineProps<{
  schemaId: string | null;
  name: string;
  description: string;
}>();

const emit = defineEmits(['structure', 'aiAssistanceToggle']);

const isAssistaceEnabled = ref(false);
const isFetchingData = ref(false);
const topicTagOptions = ref([]);
const selectedTopicTags = ref([]);
const styleTagOptions = ref([]);
const selectedStyleTags = ref([]);
const difficultyOptions: { [key: number]: AiTargetAudience } = {
  0: AiTargetAudience.BEGINNER,
  1: AiTargetAudience.INTERMEDIATE,
  2: AiTargetAudience.EXPERT,
};
const selectedDifficulty = ref(1);
const outlineTree = ref<any>([]);
const statusMessage = ref('');

const ambiguityPrompt = `
  In order for you to help, is there any ambiguity in the topic that
  I should be aware of? Present any specificators or requirements that I
  should consider in form of tags.`;

const stylePrompt = `
  I would like to get some style / school-of-thought based recommendations
  that can further help you in the future. Present options that I
  should consider in form of tags.`;

const outlinePrompt = 'Provide suggestion for the outline of the content.';

const createAiContext = (input: AiInput): AiContext => {
  const { schemaId, name, description } = props;
  if (!schemaId || !name || !description) {
    throw new Error('Missing required properties for AiContext');
  }
  const topicTags = selectedTopicTags.value.map(
    (index) => topicTagOptions.value[index],
  );
  const styleTags = selectedStyleTags.value.map(
    (index) => styleTagOptions.value[index],
  );
  return {
    repository: {
      schemaId,
      name,
      description,
      tags: [...topicTags, ...styleTags],
    },
    inputs: [input],
  };
};

watch(isAssistaceEnabled, (value) => {
  emit('aiAssistanceToggle', value);
  if (!value) {
    isFetchingData.value = false;
    topicTagOptions.value = [];
    return;
  }
  isFetchingData.value = true;
  const context = createAiContext({
    type: AiRequestType.CREATE,
    text: ambiguityPrompt,
    responseSchema: AiResponseSchema.TAG,
  });
  aiAPI.generate(context).then(({ tags }) => {
    topicTagOptions.value = tags;
    isFetchingData.value = false;
  });
});

const fetchStyle = () => {
  isFetchingData.value = true;
  const context = createAiContext({
    type: AiRequestType.CREATE,
    text: stylePrompt,
    responseSchema: AiResponseSchema.TAG,
  });
  return aiAPI.generate(context).then(({ tags }) => {
    styleTagOptions.value = tags;
    isFetchingData.value = false;
  });
};

const fetchOutline = () => {
  isFetchingData.value = true;
  statusMessage.value = 'Generating outline... This might take a while....';
  const context = createAiContext({
    type: AiRequestType.CREATE,
    text: outlinePrompt,
    responseSchema: AiResponseSchema.OUTLINE,
    targetAudience: difficultyOptions[
      selectedDifficulty.value
    ].toUpperCase() as AiTargetAudience,
  });
  aiAPI.generate(context).then(({ activities }) => {
    activities.children.forEach((it: any) => (it.expanded = true));
    outlineTree.value = [
      {
        name: props.name,
        children: activities,
        expanded: true,
      },
    ];
    isFetchingData.value = false;
    statusMessage.value = '';
    emit('structure', activities);
  });
};
</script>

<style lang="scss">
// vue3-tree-vue copied styles
.explorer-container {
  .tree-item:hover .on-item-hover {
    display: block;
  }

  .tree-item .on-item-hover {
    display: none;
  }

  .tree-item-node:hover li > .on-item-hover {
    display: block;
  }

  .tree-item-node li > .on-item-hover {
    display: none;
  }

  .tree-item {
    padding: 0.25em;
  }

  ul {
    padding-left: 0;
    margin: 0;
    list-style-type: none;
    display: inline-block;
  }

  li {
    border-radius: 4px;
  }

  .tree-item__drag-over {
    background-color: rgba(22, 22, 22, 0.068) !important;
  }

  .root__drag-over {
    border-left: 6px solid #ccc !important;
  }

  .chevron-right {
    color: gray;
  }

  .hide-chevron {
    visibility: collapse;
  }

  .icon-area {
    width: 1.375rem;
    margin-right: 0.4em;
  }

  .guide-line {
    width: 1em;
    border-top: 1px dashed rgb(192, 192, 192);
  }

  .node-name {
    cursor: pointer;
    margin-left: 5px;
  }

  .d-flex {
    display: flex;
    align-items: center;
  }

  .align-items-center {
    align-items: center;
  }

  .nested {
    margin-left: 3rem !important;
  }

  .root {
    margin-left: 1.875rem !important;
  }

  .tiny_horizontal_margin {
    margin-left: 2px;
    margin-right: 2px;
  }

  .tree-item__checkbox-area {
    display: flex;
    align-items: center;
  }

  .node-child {
    text-align: left;
    display: block;
    border-left: 1px dashed rgb(192, 192, 192);
  }

  .hide {
    display: none;
  }

  .hide-guidelines {
    border-left: none !important;
  }

  .chevron-right {
    box-sizing: border-box;
    position: relative;
    display: block;
    transform: scale(var(--ggs, 1));
    width: 1.375rem;
    height: 1.375rem;
    border: 0.125rem solid transparent;
    border-radius: 100px;
    transition: 0.2s;
  }

  .pointer {
    cursor: pointer;
  }

  .chevron-right.rotate-90::after {
    transform: rotateZ(45deg);
  }

  .chevron-right::after {
    content: '';
    display: block;
    box-sizing: border-box;
    position: absolute;
    width: 7px;
    height: 7px;
    border-bottom: 2px solid;
    border-right: 2px solid;
    transform: rotate(-45deg);
    right: 6px;
    top: 5px;
  }
}
</style>
