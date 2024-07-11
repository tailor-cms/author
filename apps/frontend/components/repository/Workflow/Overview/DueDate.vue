<template>
  <WorkflowDueDate :value="date" format="MMM d, yyyy" icon />
</template>

<script lang="ts" setup>
import WorkflowDueDate from '../WorkflowDueDate.vue';

defineProps<{ date: string }>();
</script>
