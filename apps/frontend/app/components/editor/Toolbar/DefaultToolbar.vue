<template>
  <VToolbar class="elevation-0" color="transparent" height="48">
    <VToolbarTitle class="text-body-1 font-weight-medium pl-1">
      {{ label }}
    </VToolbarTitle>
  </VToolbar>
</template>

<script lang="ts" setup>
defineProps<{ label: string }>();
</script>

