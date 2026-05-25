<template>
  <div class="session-stats text-caption">
    <span>
      <VIcon class="mx-1" icon="mdi-flash" size="11" />
      {{ turns }} turns - {{ toolCount }} tool calls
    </span>
    <span v-if="sessionId">session {{ sessionId.slice(0, 8) }}</span>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  turns: number;
  toolCount: number;
  sessionId?: string | null;
}

withDefaults(defineProps<Props>(), { sessionId: null });
</script>

<style lang="scss" scoped>
.session-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem 0.625rem;
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
  background: rgb(var(--v-theme-surface));
}
</style>
