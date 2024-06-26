<template>
  <div class="editor-link">
    <VTooltip location="right">
      <template #activator="{ props: tooltipProps }">
        <VBtn
          v-bind="{ ...$attrs, ...tooltipProps }"
          :to="editorRoute"
          color="teal-lighten-4"
          size="x-small"
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
import { computed } from 'vue';

interface Props {
  activityId: number;
  label: string;
  elementUid?: string;
}

const props = withDefaults(defineProps<Props>(), {
  elementUid: '',
});

const editorRoute = computed(() => ({
  name: 'editor',
  params: { activityId: props.activityId },
  ...(props.elementUid && { query: { elementId: props.elementUid } }),
}));
</script>
