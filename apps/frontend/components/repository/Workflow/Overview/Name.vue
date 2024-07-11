<template>
  <VTooltip open-delay="800" bottom>
    <template #activator="{ props: tooltipProps }">
      <div v-bind="tooltipProps" class="column-name text-truncate">
        {{ value }}
      </div>
    </template>
    {{ value }}
  </VTooltip>
</template>

<script lang="ts" setup>
defineProps<{ value: string }>();
</script>
