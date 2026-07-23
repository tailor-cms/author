<template>
  <VProgressCircular size="68" indeterminate color="outline">
    <template #default>
      <img :src="logoUrl" alt="Tailor logo" width="34" />
    </template>
  </VProgressCircular>
</template>

<script lang="ts" setup>
const logoUrl = new URL('../assets/logo.svg', import.meta.url).href;
</script>
