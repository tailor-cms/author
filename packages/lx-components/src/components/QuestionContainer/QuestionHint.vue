<template>
  <VTooltip
    v-model="showHint"
    :open-on-hover="false"
    location="bottom left"
    max-width="250"
    close-on-back
    open-on-click
  >
    <template #activator="{ isActive, props: tooltipProps }">
      <VBtn
        v-click-outside="() => (showHint = false)"
        v-bind="tooltipProps"
        :active="isActive"
        :prepend-icon="`mdi-lightbulb-${isActive ? 'on' : 'outline'}`"
        color="primary-darken-1"
        size="small"
        text="Hint"
        variant="tonal"
        rounded
      />
    </template>
    {{ hint }}
  </VTooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ hint: string }>();

const showHint = ref(false);
</script>
