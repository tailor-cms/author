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
      <VBtn
        v-tooltip:[tooltipLocation]="{ text: 'Generate content', openDelay: 1000 }"
        v-bind="menuProps"
        :color="color"
        aria-label="Generate content"
        icon="mdi-creation"
        size="x-small"
        variant="tonal"
      />
    </template>
    <VSheet :theme="$vuetify.theme.global.name" class="mt-2 pa-7" rounded="lg">
      <VTextarea
        v-model="promptText"
        label="Prompt"
        rows="3"
        variant="outlined"
        placeholder="Optional: give extra context"
      />
      <div class="d-flex justify-end">
        <VBtn
          prepend-icon="mdi-creation"
          text="Generate"
          variant="tonal"
          @click="onPromptSubmit"
        />
      </div>
    </VSheet>
  </VMenu>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

interface Props {
  color?: string;
  tooltipLocation?: 'top' | 'bottom' | 'left' | 'right';
}

withDefaults(defineProps<Props>(), {
  color: 'secondary',
  tooltipLocation: 'left',
});
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
