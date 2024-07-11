<template>
  <WorkflowDueDate :value="value" format="MMM d, yyyy" icon />
</template>

<script lang="ts" setup>
import WorkflowDueDate from '../WorkflowDueDate.vue';

defineProps<{ value: string }>();
</script>
