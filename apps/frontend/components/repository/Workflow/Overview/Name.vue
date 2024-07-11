<template>
  <VTooltip open-delay="800" bottom>
    <template #activator="{ props: tooltipProps }">
      <div v-bind="tooltipProps" class="column-name text-truncate">
        {{ name }}
      </div>
    </template>
    {{ name }}
  </VTooltip>
</template>

<script lang="ts" setup>
defineProps<{ name: string }>();
</script>
