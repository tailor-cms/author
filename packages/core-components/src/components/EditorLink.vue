<template>
  <div class="editor-link">
    <VBtn
      v-tooltip:right="'View element'"
      v-bind="$attrs"
      :to="editorRoute"
      :text="label"
      append-icon="mdi-arrow-top-right-thick"
      size="x-small"
      variant="text"
    />
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
