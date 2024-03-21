<template>
  <div class="editor-link">
    <VTooltip location="right">
      <template #activator="{ props: tooltipProps }">
        <VBtn
          v-bind="{ ...$attrs, ...tooltipProps }"
          :to="editorRoute"
          color="teal-accent-1"
          size="small"
          variant="text"
        >
          {{ label }}
          <slot name="icon">
            <VIcon class="ml-1" size="small">mdi-arrow-top-right-thick</VIcon>
          </slot>
        </VBtn>
      </template>
      <slot name="tooltip">
        <span>View element</span>
      </slot>
    </VTooltip>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  activityId: { type: Number, required: true },
  elementUid: { type: String, default: null },
  label: { type: String, required: true },
});

const editorRoute = computed(() => ({
  name: 'editor',
  params: { activityId: props.activityId },
  ...(props.elementUid && { query: { elementId: props.elementUid } }),
}));
</script>
