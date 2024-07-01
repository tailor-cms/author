<template>
  <VToolbar class="elevation-0" color="primary-darken-3" height="72">
    <VToolbarTitle class="pl-1">{{ label }}</VToolbarTitle>
  </VToolbar>
</template>

<script lang="ts" setup>
defineProps<{ label: string }>();
</script>
