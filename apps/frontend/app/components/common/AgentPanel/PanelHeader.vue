<template>
  <VSheet class="panel-header pa-4" color="transparent">
    <div class="d-flex align-center ga-2">
      <span class="text-title-medium font-weight-bold">Renoir</span>
      <VSpacer />
      <VHotkey
        class="text-label-small text-uppercase"
        keys="cmd+k"
        prefix="Shortcut"
        density="compact"
        variant="tonal"
      />
      <VBtn
        :disabled="isRunning"
        color="warning"
        density="comfortable"
        icon="mdi-restart"
        size="small"
        title="New session"
        variant="tonal"
        @click="$emit('session:reset')"
      />
      <VBtn
        density="comfortable"
        icon="mdi-close"
        size="small"
        title="Minimize"
        variant="tonal"
        @click="$emit('panel:close')"
      />
    </div>
  </VSheet>
</template>

<script lang="ts" setup>
interface Props {
  isRunning?: boolean;
}

withDefaults(defineProps<Props>(), { isRunning: false });

defineEmits<{
  'session:reset': [];
  'panel:close': [];
}>();
</script>

<style lang="scss" scoped>
.v-hotkey {
  :deep(.v-kbd) {
    padding: 0.125rem 0.25rem;
    font-size: 0.625rem;
  }

  :deep(.v-hotkey__key-icon .v-icon) {
    font-size: 0.625rem;
  }
}
</style>
