<template>
  <VCard
    :to="{ name: 'repository', query: { activityId: id } }"
    class="d-flex align-center pa-2"
    variant="tonal"
  >
    <VIcon :color="color" icon="mdi-label" />
    <span
      v-tooltip:bottom="{ text: `${typeLabel} ID`, openDelay: 500 }"
      class="flex-shrink-0 mx-2"
    >
      {{ shortId }}
    </span>
    <div class="text-truncate">{{ name }}</div>
    <VSpacer />
    <VIcon class="mx-1" icon="mdi-arrow-right" size="small" />
  </VCard>
</template>

<script lang="ts" setup>
defineProps<{
  id: number;
  shortId: string;
  name: string;
  typeLabel: string;
  color: string;
}>();
</script>
