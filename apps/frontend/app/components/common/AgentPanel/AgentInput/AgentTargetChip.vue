<template>
  <VChip
    v-tooltip:top="{
      text: chip?.full || 'No focus - select an activity in the editor',
      zIndex: 9100,
      openDelay: 200,
    }"
    class="agent-target-chip"
    prepend-icon="mdi-target"
    size="small"
    variant="tonal"
    rounded="pill"
  >
    <span class="text-truncate">{{ chip?.short || 'No focus' }}</span>
  </VChip>
</template>

<script lang="ts" setup>
interface FocusChip {
  short: string;
  full: string;
}

defineProps<{ chip: FocusChip | null }>();
</script>
