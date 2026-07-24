<template>
  <button :class="{ disabled }" class="inline-activator d-block">
    <VDivider content-offset="-16" opacity="0.5">
      <VAvatar
        color="surface-container-highest"
        icon="mdi-plus"
        size="x-small"
      />
    </VDivider>
  </button>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ disabled?: boolean }>(), {
  disabled: false,
});
</script>

<style lang="scss" scoped>
.inline-activator {
  width: 100%;
  padding: 0 3.125rem;
  background: transparent;
  border: none;
  opacity: 0;
  transition: opacity 0.3s, padding 0.3s;
  margin-top: -1.5rem;

  :deep(.v-divider__content) {
    line-height: 1;
  }

  &:hover,
  &:focus {
    padding: 1rem 0;
    opacity: 1;
    outline: none;
    transition: opacity 0.3s 0.25s, padding 0.3s 0.1s;
  }

  &.disabled {
    pointer-events: none;
  }
}
</style>
