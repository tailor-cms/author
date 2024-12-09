<template>
  <VTooltip
    v-model="showHint"
    :open-on-hover="false"
    location="bottom"
    max-width="350"
    close-on-back
    open-on-click
  >
    <template #activator="{ isActive, props: tooltipProps }">
      <VBtn
        v-click-outside="() => (showHint = false)"
        v-bind="tooltipProps"
        :active="isActive"
        :prepend-icon="`mdi-lightbulb-${isActive ? 'on' : 'outline'}`"
        size="small"
        text="Hint"
        variant="text"
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
