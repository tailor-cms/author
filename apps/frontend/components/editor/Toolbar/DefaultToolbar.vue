<template>
  <VToolbar class="elevation-0" color="transparent" height="72">
    <VToolbarTitle class="pl-1">{{ label }}</VToolbarTitle>
  </VToolbar>
</template>

<script lang="ts" setup>
defineProps<{ label: string }>();
</script>
