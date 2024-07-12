<template>
  <VCard
    :to="{ name: 'repository', query: { activityId: id } }"
    class="d-flex align-center pa-2"
    variant="tonal"
  >
    <VIcon :color="color" icon="mdi-label" />
    <VTooltip open-delay="500" bottom>
      <template #activator="{ props: tooltipProps }">
        <span v-bind="tooltipProps" class="flex-shrink-0 mx-2">
          {{ shortId }}
        </span>
      </template>
      {{ typeLabel }} ID
    </VTooltip>
    <div class="text-truncate">{{ name }}</div>
    <VSpacer />
    <VIcon class="mx-1" icon="mdi-arrow-right" />
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
