<template>
  <button :class="{ disabled }" class="inline-activator">
    <VDivider content-offset="-16" opacity="0.5" gradient>
      <VAvatar color="tertiary" icon="mdi-plus" size="x-small" />
    </VDivider>
  </button>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ disabled?: boolean }>(), {
  disabled: false,
});
</script>

<style lang="scss" scoped>
.default-activator-state {
  padding: 0 3.125rem;
  opacity: 0;
}

.inline-activator {
  @extend .default-activator-state;

  display: flex;
  align-items: center;
  width: 100%;
  margin: 0;
  padding: 0 3.125rem;
  background: transparent;
  border: none;
  opacity: 0;
  transition:
    opacity 0.3s,
    padding 0.3s;

  .v-divider__wrapper {
    flex: 1;
    display: inline-flex;
    margin: 0;
  }

  &:hover,
  &:focus {
    padding: 0 0 1.25rem 0;
    opacity: 1;
    outline: none;
    transition:
      opacity 0.3s 0.25s,
      padding 0.3s 0.1s;
  }

  &.disabled,
  &.disabled:hover {
    @extend .default-activator-state;
    pointer-events: none;
  }
}
</style>
