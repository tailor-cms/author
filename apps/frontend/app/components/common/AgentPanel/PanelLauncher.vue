<template>
  <VFab
    :loading="isRunning"
    class="panel-launcher"
    color="secondary"
    icon
    @click="$emit('open')"
  >
    <VAvatar color="transparent" image="/img/renoir-head.png" size="small" />
  </VFab>
</template>

<script lang="ts" setup>
interface Props {
  isRunning?: boolean;
}

withDefaults(defineProps<Props>(), { isRunning: false });
defineEmits<{ open: [] }>();
</script>
