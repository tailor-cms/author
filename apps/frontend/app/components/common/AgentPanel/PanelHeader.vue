<template>
  <VSheet class="panel-header pa-4" color="transparent">
    <div class="d-flex align-center ga-2">
      <span class="text-title-medium font-weight-bold">Renoir</span>
      <VSpacer />
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
        title="Collapse sidebar"
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
