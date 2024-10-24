<template>
  <VOverlay
    :model-value="show"
    class="align-center justify-center"
    opacity="0.9"
    scrim="grey-darken-4"
    close-on-content-click
    contained
  >
    <VBtn class="text-body-1" color="white" variant="text" rounded>
      <slot>Click to preview</slot>
    </VBtn>
  </VOverlay>
</template>

<script lang="ts" setup>
interface Props {
  show?: boolean;
}

withDefaults(defineProps<Props>(), {
  show: false,
});
</script>
