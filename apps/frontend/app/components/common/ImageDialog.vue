<template>
  <VOverlay
    v-model="isOpen"
    class="image-dialog"
    content-class="d-flex align-center justify-center h-100 w-100"
    close-on-content-click
  >
    <VBtn
      aria-label="Close"
      class="position-absolute top-0 right-0 ma-4"
      icon="mdi-close"
      variant="tonal"
      @click="isOpen = false"
    />
    <img v-if="src" :alt="alt" :src="src" :style="frame" />
  </VOverlay>
</template>

<script lang="ts" setup>
const MAX_WIDTH = '90vw';
const MAX_HEIGHT = '80vh';

interface Props {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

const props = defineProps<Props>();

const isOpen = defineModel<boolean>({ required: true });

const frame = computed(() => {
  const { width, height } = props;
  if (!width || !height) return undefined;
  const ratio = width / height;
  return {
    width: `min(${width}px, ${MAX_WIDTH}, calc(${MAX_HEIGHT} * ${ratio}))`,
    aspectRatio: String(ratio),
  };
});
</script>

<style scoped>
.image-dialog {
  backdrop-filter: blur(1.125rem);
}

.image-dialog img {
  display: block;
  max-width: v-bind(MAX_WIDTH);
  max-height: v-bind(MAX_HEIGHT);
  border-radius: 0.5rem;
  object-fit: contain;
  background: rgba(var(--v-theme-surface), 0.4);
  box-shadow: 0 1.5rem 3rem rgba(0, 0, 0, 0.4);
}
</style>
