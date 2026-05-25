<template>
  <VFab
    :loading="isRunning"
    class="panel-launcher"
    color="primary-darken-3"
    data-agent-target="panel-launcher"
    size="default"
    icon
    @click="$emit('open')"
  >
    <span class="launcher-frame">
      <img alt="Renoir" class="launcher-avatar" src="/img/renoir-head.png" />
    </span>
  </VFab>
</template>

<script lang="ts" setup>
interface Props {
  isRunning?: boolean;
}

withDefaults(defineProps<Props>(), { isRunning: false });
defineEmits<{ open: [] }>();
</script>

<style lang="scss" scoped>
.launcher-frame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: #fff5dd;
}

.launcher-avatar {
  width: 100%;
  height: 100%;
  padding: 0.125rem;
  border-radius: 50%;
  background: transparent;
  object-fit: contain;
}
</style>
