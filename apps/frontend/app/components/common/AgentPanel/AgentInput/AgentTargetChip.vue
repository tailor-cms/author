<template>
  <VChip
    class="agent-target-chip"
    prepend-icon="mdi-target"
    size="small"
    variant="tonal"
    rounded="pill"
  >
    <span class="text-truncate">{{ chip?.short || 'No focus' }}</span>
    <VTooltip
      :text="chip?.full || 'No focus - select an activity in the editor'"
      activator="parent"
      :z-index="9100"
      location="top"
      open-delay="200"
    />
  </VChip>
</template>

<script lang="ts" setup>
interface FocusChip {
  short: string;
  full: string;
}

defineProps<{ chip: FocusChip | null }>();
</script>
