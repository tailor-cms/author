<template>
  <VMenu v-model="isVisible" :close-on-content-click="false" location="bottom">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        color="indigo-darken-2"
        size="small"
        variant="tonal"
      >
        AI prompt
      </VBtn>
    </template>
    <VCard class="mt-2 pa-7" color="primary-darken-4" min-width="410">
      <VBtnToggle
        v-model="promptType"
        base-color="primary-lighten-5"
        class="mb-6"
        color="secondary-lighten-3"
        density="compact"
        variant="tonal"
        group
      >
        <VBtn value="ADD">
          <VIcon start>mdi-plus</VIcon>
          Add
        </VBtn>
        <VBtn value="MODIFY">
          <VIcon start>mdi-update</VIcon>
          Modify
        </VBtn>
      </VBtnToggle>
      <VTextarea v-model="promptText" label="Prompt" variant="outlined" />
      <VCardAction class="d-flex justify-end">
        <VBtn
          color="primary-lighten-3"
          density="comfortable"
          variant="tonal"
          @click="onPromptSubmit"
        >
          <VIcon start>mdi-magic-staff</VIcon>
          Generate
        </VBtn>
      </VCardAction>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import type { AiInput, AIRequestType } from '@tailor-cms/interfaces/ai';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { ref, watch } from 'vue';

const props = defineProps<{
  inputs: AiInput[];
  contentElements: ContentElement[];
}>();

const emit = defineEmits<{
  (
    name: 'generate',
    payload: AiInput,
  ): void;
}>();

const isVisible = ref(false);
const promptText = ref('');
const promptType = ref<AIRequestType>('ADD');

const onPromptSubmit = async () => {
  if (!promptText.value) return;
  emit('generate', {
    type: promptType.value,
    text: promptText.value,
  });
  isVisible.value = false;
};

watch(isVisible, (val) => {
  if (!val) return;
  promptText.value = '';
  promptType.value = props.contentElements?.length ? 'MODIFY' : 'ADD';
});
</script>
