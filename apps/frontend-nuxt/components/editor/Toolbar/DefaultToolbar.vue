<template>
  <VToolbar height="72" color="primary-darken-3" class="elevation-0">
    <VToolbarTitle class="pl-1">{{ props.label }}</VToolbarTitle>
  </VToolbar>
</template>

<script lang="ts" setup>
const props = defineProps({
  label: { type: String, required: true },
});
</script>
