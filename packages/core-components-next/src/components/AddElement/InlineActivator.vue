<template>
  <button class="inline-activator">
    <hr />
    <VAvatar color="primary-darken-4" size="20">
      <VIcon size="16">mdi-plus</VIcon>
    </VAvatar>
    <hr />
  </button>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

defineProps({
  disabled: { type: Boolean, required: false },
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
  opacity: 0;
  transition:
    opacity 0.3s,
    padding 0.3s;

  hr {
    flex: 1;
    display: inline-flex;
    margin: 0;
    border-top: 0.0625rem solid #37474f;
  }

  &:hover,
  &:focus {
    padding: 0.75rem 0;
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
