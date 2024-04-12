<template>
  <VToolbar class="elevation-0" color="primary-darken-3" height="72">
    <VToolbarTitle class="pl-1">{{ props.label }}</VToolbarTitle>
  </VToolbar>
</template>

<script lang="ts" setup>
const props = defineProps({
  label: { type: String, required: true },
});
</script>
