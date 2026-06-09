<template>
  <div class="session-stats text-body-small border-t px-4 py-3">
    <span>
      <VIcon icon="mdi-flash" size="x-small" />
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
}
</style>
