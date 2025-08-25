<template>
  <VMenu
    v-model="isVisible"
    :close-on-click="!isConfirmationActive"
    :close-on-content-click="false"
    class="element-generation"
    location="left"
    min-width="450"
    offset="4"
    transition="slide-y-transition"
  >
    <template #activator="{ props: menuProps }">
      <VTooltip location="left" open-delay="1000">
        <template #activator="{ props: tooltipProps }">
          <VBtn
            v-bind="{ ...menuProps, ...tooltipProps }"
            aria-label="Generate content"
            color="indigo"
            icon="mdi-creation"
            size="x-small"
            variant="tonal"
          />
        </template>
        Generate content
      </VTooltip>
    </template>
    <VSheet class="mt-2 pa-7" color="primary-darken-4">
      <VTextarea
        v-model="promptText"
        label="Prompt"
        rows="3"
        variant="outlined" />
      <div class="d-flex justify-end">
        <VBtn
          color="primary-lighten-3"
          variant="tonal"
          :slim="false"
          prepend-icon="mdi-creation"
          @click="onPromptSubmit"
        >
          Generate
        </VBtn>
      </div>
    </VSheet>
  </VMenu>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

const emit = defineEmits(['generate']);

const isVisible = ref(false);
const isConfirmationActive = ref(false);
const promptText = ref('');

const onPromptSubmit = async () => {
  const text = promptText.value.trim();
  emit('generate', text);
  isVisible.value = false;
};

watch(isVisible, (val) => {
  if (!val) return;
  promptText.value = '';
});
</script>
