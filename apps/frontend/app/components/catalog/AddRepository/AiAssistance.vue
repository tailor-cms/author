<template>
  <VSwitch
    v-model="isAssistaceEnabled"
    :disabled="!schemaId || !name || !description"
    color="primary-darken-2"
    label="AI assisted"
  />
  <div v-if="isAssistaceEnabled" class="ai-panel">
    <DocumentUpload
      @doc:uploaded="vectorStoreId = $event"
      @doc:processing="handleProcessingChange"
    />
    <VBtn
      v-if="!topicTagOptions.length"
      :disabled="isUploading"
      :loading="isFetchingData"
      class="mb-6"
      color="primary-darken-2"
      variant="tonal"
      block
      @click="fetchTopics"
    >
      Continue
    </VBtn>
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
        v-if="!styleTagOptions.length"
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
        Select perspectives you are interested in:
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
        v-if="!outlineTree.length"
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
    <OutlinePreview :items="outlineTree" />
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

import DocumentUpload from './DocumentUpload.vue';
import OutlinePreview from './OutlinePreview.vue';
import aiAPI from '@/api/ai';

const props = defineProps<{
  schemaId: string | null;
  name: string;
  description: string;
}>();

const emit = defineEmits([
  'ai:toggle',
  'ai:outline',
  'ai:context',
  'ai:indexing',
]);

const isAssistaceEnabled = ref(false);
const isFetchingData = ref(false);
const isUploading = ref(false);
const vectorStoreId = ref<string | null>(null);
const topicTagOptions = ref([]);
const selectedTopicTags = ref([]);
const styleTagOptions = ref([]);
const selectedStyleTags = ref([]);
const difficultyOptions: { [key: number]: AiTargetAudience } = {
  0: AiTargetAudience.Beginner,
  1: AiTargetAudience.Intermediate,
  2: AiTargetAudience.Expert,
};
const selectedDifficulty = ref(1);
const outlineTree = ref<any>([]);
const statusMessage = ref('');

const ambiguityPrompt = `
  In order for you to provide better content, is there any ambiguity in the
  topic that I should be aware of? Present any specificators or requirements
  that I should consider in form of tags.`;

const stylePrompt = `
  I would like to get some style / school-of-thought based recommendations
  that can further help you in the future. Present options that I
  should consider in form of tags.`;

const createAiContext = (input: AiInput): AiContext => {
  const { schemaId, name, description } = props;
  if (!schemaId || !name || !description) {
    throw new Error('Missing required properties for the AiContext');
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
      ...(vectorStoreId.value && { vectorStoreId: vectorStoreId.value }),
    },
    inputs: [input],
  };
};

const handleProcessingChange = (val: boolean) => {
  isUploading.value = val;
  emit('ai:indexing', val);
};

// Consolidated AI context: vectorStoreId + preferences
const aiContext = computed(() => ({
  ...(vectorStoreId.value && { vectorStoreId: vectorStoreId.value }),
  topicTags: selectedTopicTags.value.map(
    (i: number) => topicTagOptions.value[i],
  ),
  styleTags: selectedStyleTags.value.map(
    (i: number) => styleTagOptions.value[i],
  ),
  targetAudience: difficultyOptions[selectedDifficulty.value],
}));

watch(aiContext, (val) => emit('ai:context', val), { deep: true });

watch(isAssistaceEnabled, (value) => {
  emit('ai:toggle', value);
  if (!value) {
    isFetchingData.value = false;
    topicTagOptions.value = [];
    styleTagOptions.value = [];
  }
});

const fetchTopics = () => {
  isFetchingData.value = true;
  const context = createAiContext({
    type: AiRequestType.Create,
    text: ambiguityPrompt,
    responseSchema: AiResponseSchema.Tag,
  });
  aiAPI.generate(context).then(({ tags }) => {
    topicTagOptions.value = tags;
    isFetchingData.value = false;
  });
};

const fetchStyle = () => {
  isFetchingData.value = true;
  const context = createAiContext({
    type: AiRequestType.Create,
    text: stylePrompt,
    responseSchema: AiResponseSchema.Tag,
  });
  return aiAPI.generate(context).then(({ tags }) => {
    styleTagOptions.value = tags;
    isFetchingData.value = false;
  });
};

const fetchOutline = async () => {
  isFetchingData.value = true;
  statusMessage.value = 'Generating outline... This might take a while....';
  const context = createAiContext({
    type: AiRequestType.Create,
    text: 'Provide suggestion for the outline of the content.',
    responseSchema: AiResponseSchema.Outline,
    targetAudience: difficultyOptions[selectedDifficulty.value],
  });
  const activities = await aiAPI.generate(context);
  activities.forEach((it: any) => (it.expanded = true));
  outlineTree.value = [
    {
      name: props.name,
      expanded: true,
      children: activities,
    },
  ];
  isFetchingData.value = false;
  statusMessage.value = '';
  emit('ai:outline', activities);
};
</script>

<style lang="scss" scoped>
.v-slider :deep(.v-slider-track__tick-label) {
  text-transform: lowercase;

  &:first-letter {
    text-transform: uppercase;
  }
}
</style>
