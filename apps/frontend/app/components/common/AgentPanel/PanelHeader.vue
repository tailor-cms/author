<template>
  <VSheet class="panel-header pa-4">
    <div class="d-flex align-center ga-2">
      <VAvatar
        color="secondary"
        image="/img/renoir/head.png"
        class="pa-1"
        size="small"
      />
      <span class="header-title font-weight-semibold ml-1">Renoir</span>
      <VSpacer />
      <VHotkey
        class="text-label-small text-uppercase"
        keys="cmd+k"
        prefix="Shortcut"
        density="compact"
        variant="tonal"
      />
      <VBtn
        :icon="isExpanded ? 'mdi-arrow-collapse' : 'mdi-arrow-expand'"
        :title="isExpanded ? 'Shrink' : 'Expand'"
        density="comfortable"
        size="small"
        variant="tonal"
        @click="$emit('panel:toggle-expand')"
      />
      <VBtn
        :disabled="isRunning"
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
        title="Hide"
        variant="tonal"
        @click="$emit('panel:close')"
      />
    </div>
  </VSheet>
</template>

<script lang="ts" setup>
interface Props {
  isRunning?: boolean;
  isExpanded?: boolean;
}

withDefaults(defineProps<Props>(), { isRunning: false, isExpanded: false });

defineEmits<{
  'session:reset': [];
  'panel:toggle-expand': [];
  'panel:close': [];
}>();
</script>

<style lang="scss" scoped>
.v-hotkey {
  :deep(.v-hotkey__prefix) {
    font-weight: bold;
  }

  :deep(.v-kbd) {
    padding: 0.125rem 0.25rem;
    font-size: 0.625rem;
  }

  :deep(.v-hotkey__key-icon .v-icon) {
    font-size: 0.625rem;
  }
}

.header-title {
  font-size: 1.25rem;
}
</style>
