<template>
  <div>
    <div
      ref="container"
      :class="{ 'is-loaded': image }"
      aria-label="Avatar crop area"
      class="cropper-container"
      role="img"
      tabindex="0"
      @mousedown="onMouseDown"
      @touchend="onTouchEnd"
      @touchmove.prevent="onTouchMove"
      @touchstart.prevent="onTouchStart"
      @wheel.prevent="onWheel"
    >
      <img
        v-if="image"
        :src="src"
        :style="imageStyle"
        alt="Crop preview"
        class="cropper-image"
        draggable="false"
      />
    </div>
    <div class="zoom-controls d-flex align-center ga-3 mt-6 mb-3">
      <VIcon icon="mdi-minus" size="20" />
      <VSlider
        v-model="zoom"
        :max="MAX_ZOOM"
        :min="MIN_ZOOM"
        :step="ZOOM_STEP"
        aria-label="Zoom level"
        hide-details
        thumb-label
        @update:model-value="constrainPosition"
      >
        <template #thumb-label="{ modelValue }">
          {{ modelValue.toFixed(1) }}x
        </template>
      </VSlider>
      <VIcon icon="mdi-plus" size="20" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onKeyStroke, useEventListener, useThrottleFn } from '@vueuse/core';

interface Props {
  src: string;
  size?: number;
  outputSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 300,
  outputSize: 250,
});

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const KEYBOARD_STEP = 10;
const WHEEL_THROTTLE_MS = 50;
const PINCH_SENSITIVITY = 0.01;

const PAN_KEYS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: 1, y: 0 },
  ArrowRight: { x: -1, y: 0 },
  ArrowUp: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: -1 },
};

const ZOOM_KEYS: Record<string, number> = {
  '+': 1,
  '=': 1,
  '-': -1,
  '_': -1,
};

const container = ref<HTMLElement | null>(null);
const image = ref<HTMLImageElement | null>(null);
const zoom = ref(MIN_ZOOM);
const baseScale = ref(1);
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const lastTouchDistance = ref(0);

const actualScale = computed(() => baseScale.value * zoom.value);
const scaledWidth = computed(() =>
  image.value ? image.value.naturalWidth * actualScale.value : 0,
);
const scaledHeight = computed(() =>
  image.value ? image.value.naturalHeight * actualScale.value : 0,
);

const imageStyle = computed(() => {
  const { x, y } = position.value;
  return {
    transform: `translate(${x}px, ${y}px) scale(${actualScale.value})`,
    transformOrigin: '0 0',
  };
});

const clampZoom = (value: number) =>
  Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value)) * 10) / 10;

const getTouchDistance = (a: Touch, b: Touch) => {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const loadImage = (src: string) => {
  const img = new Image();
  img.onload = () => {
    image.value = img;
    baseScale.value = Math.max(
      props.size / img.naturalWidth,
      props.size / img.naturalHeight,
    );
    zoom.value = MIN_ZOOM;
    position.value = {
      x: (props.size - scaledWidth.value) / 2,
      y: (props.size - scaledHeight.value) / 2,
    };
  };
  img.onerror = () => (image.value = null);
  img.src = src;
};

/** Keeps the framed image covering the whole viewport (no empty gaps). */
const constrainPosition = () => {
  if (!image.value) return;
  const minX = props.size - scaledWidth.value;
  const minY = props.size - scaledHeight.value;
  position.value.x = Math.max(minX, Math.min(0, position.value.x));
  position.value.y = Math.max(minY, Math.min(0, position.value.y));
};

const onMouseDown = (e: MouseEvent) => {
  isDragging.value = true;
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };
};

// Track on the window so a drag past the circle's edge keeps panning and a
// release outside still ends it.
useEventListener(window, 'mousemove', (e: MouseEvent) => {
  if (!isDragging.value) return;
  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y,
  };
  constrainPosition();
});
useEventListener(window, 'mouseup', () => (isDragging.value = false));

const onWheel = useThrottleFn((e: WheelEvent) => {
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
  zoom.value = clampZoom(zoom.value + delta);
  constrainPosition();
}, WHEEL_THROTTLE_MS);

const onTouchStart = (e: TouchEvent) => {
  const [first, second] = [e.touches[0], e.touches[1]];
  if (e.touches.length === 1 && first) {
    isDragging.value = true;
    dragStart.value = {
      x: first.clientX - position.value.x,
      y: first.clientY - position.value.y,
    };
  } else if (first && second) {
    isDragging.value = false;
    lastTouchDistance.value = getTouchDistance(first, second);
  }
};

const onTouchMove = (e: TouchEvent) => {
  const [first, second] = [e.touches[0], e.touches[1]];
  if (e.touches.length === 1 && isDragging.value && first) {
    position.value = {
      x: first.clientX - dragStart.value.x,
      y: first.clientY - dragStart.value.y,
    };
    constrainPosition();
  } else if (first && second) {
    const distance = getTouchDistance(first, second);
    if (lastTouchDistance.value > 0) {
      const delta = (distance - lastTouchDistance.value) * PINCH_SENSITIVITY;
      zoom.value = clampZoom(zoom.value + delta);
      constrainPosition();
    }
    lastTouchDistance.value = distance;
  }
};

const onTouchEnd = () => {
  isDragging.value = false;
  lastTouchDistance.value = 0;
};

onKeyStroke((e) => Object.hasOwn(PAN_KEYS, e.key), (e) => {
  e.preventDefault();
  const pan = PAN_KEYS[e.key]!;
  position.value.x += pan.x * KEYBOARD_STEP;
  position.value.y += pan.y * KEYBOARD_STEP;
  constrainPosition();
}, { target: container });

onKeyStroke((e) => Object.hasOwn(ZOOM_KEYS, e.key), (e) => {
  e.preventDefault();
  zoom.value = clampZoom(zoom.value + ZOOM_KEYS[e.key]! * ZOOM_STEP);
  constrainPosition();
}, { target: container });

const toBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/**
 * Renders the framed region to a square canvas at the requested output
 * size and returns it as a JPEG data URL.
 */
const crop = async (): Promise<string | null> => {
  if (!image.value) return null;
  const canvas = new OffscreenCanvas(props.outputSize, props.outputSize);
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  const scale = props.outputSize / props.size;
  context.drawImage(
    image.value,
    position.value.x * scale,
    position.value.y * scale,
    scaledWidth.value * scale,
    scaledHeight.value * scale,
  );
  const blob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.8,
  });
  return toBase64(blob);
};

defineExpose({ getResult: crop });

watch(() => props.src, (src) => src && loadImage(src), { immediate: true });
</script>

<style lang="scss" scoped>
.cropper-container {
  position: relative;
  width: v-bind('props.size + "px"');
  height: v-bind('props.size + "px"');
  margin: 0 auto;
  overflow: hidden;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface-container-highest));

  &.is-loaded {
    cursor: move;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }
}

.cropper-image {
  position: absolute;
  top: 0;
  left: 0;
  user-select: none;
  pointer-events: none;
  will-change: transform;
}

.zoom-controls {
  width: v-bind('props.size + "px"');
  margin-inline: auto;
}
</style>
