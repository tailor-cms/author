<template>
  <VMenu v-model="isVisible" :close-on-content-click="false" location="bottom">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        color="secondary"
        size="small"
        text="AI Prompt"
        variant="tonal"
      />
    </template>
    <VCard class="mt-2 pa-7" min-width="410">
      <VBtnToggle
        v-model="promptType"
        class="mb-6"
        color="secondary"
        density="compact"
        variant="tonal"
        group
      >
        <VBtn :value="AiRequestType.Add" prepend-icon="mdi-plus" text="Add" />
        <VBtn :value="AiRequestType.Modify" prepend-icon="mdi-update" text="Modify" />
      </VBtnToggle>
      <VTextarea
        v-model="promptText"
        label="Prompt"
        variant="outlined"
        @keydown.meta.enter="onSubmit"
        @keydown.ctrl.enter="onSubmit"
      />
      <VCardActions class="d-flex justify-end">
        <VBtn
          :disabled="!hasInput"
          :slim="false"
          append-icon="mdi-shimmer"
          text="Generate"
          variant="tonal"
          @click="onSubmit"
        />
      </VCardActions>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import { AiRequestType, AiResponseSchema } from '@tailor-cms/interfaces/ai';
import type { AiInput } from '@tailor-cms/interfaces/ai';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { computed, ref, watch } from 'vue';

defineProps<{
  inputs: AiInput[];
  contentElements: ContentElement[];
}>();

const emit = defineEmits<{
  (name: 'generate', payload: AiInput): void;
}>();

const isVisible = ref(false);
const promptText = ref('');
const promptType = ref<AiRequestType>(AiRequestType.Add);

const hasInput = computed(() => !!promptText.value.trim());

const onSubmit = () => {
  if (!hasInput.value) return;
  emit('generate', {
    type: promptType.value,
    text: promptText.value.trim(),
    responseSchema: AiResponseSchema.Html,
  });
  isVisible.value = false;
};

watch(isVisible, (val) => {
  if (!val) return;
  promptText.value = '';
});
</script>
