<template>
  <VTooltip location="bottom" open-delay="800">
    <template #activator="{ props: tooltipProps }">
      <div v-bind="tooltipProps">{{ name }}</div>
    </template>
    {{ name }}
  </VTooltip>
</template>

<script lang="ts" setup>
defineProps<{ name: string }>();
</script>
