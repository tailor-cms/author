<template>
  <VSheet class="panel-header pa-3">
    <div class="d-flex align-center ga-2">
      <VAvatar
        image="/img/renoir-head.png"
        class="pa-1"
        size="small"
      />
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
    <div class="d-flex align-center text-body-small opacity-60 mt-2">
      <VIcon icon="mdi-target" size="small" start />
      <span class="text-truncate">
        {{ focusLabel || 'No focus - select an activity in the editor' }}
      </span>
    </div>
  </VSheet>
</template>

<script lang="ts" setup>
interface Props {
  focusLabel: string;
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
</style>
