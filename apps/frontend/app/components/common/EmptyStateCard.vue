<template>
  <VCard
    :data-testid="testId"
    class="empty-state-card pa-8 text-center"
    color="surface-container"
    rounded="lg"
    variant="flat"
    width="230"
  >
    <VAvatar v-if="icon" color="tertiary" size="64" variant="tonal">
      <VIcon :icon="icon" size="x-large" />
    </VAvatar>
    <div class="text-body-large font-weight-semibold mt-4">{{ title }}</div>
    <div class="text-body-small text-medium-emphasis mt-1">{{ text }}</div>
  </VCard>
</template>

<script lang="ts" setup>
defineProps<{ title: string; text: string; icon?: string; testId?: string }>();
</script>

<style lang="scss" scoped>
.empty-state-card {
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }
}
</style>
