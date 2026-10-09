<template>
  <div :style="{ aspectRatio }" class="embed-frame">
    <iframe
      v-if="isOpen"
      :allow="ALLOW"
      :src="src"
      :title="name"
      class="embed-content"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
    >
    </iframe>
    <button
      v-else
      :aria-label="label"
      class="embed-content poster"
      type="button"
      @click="isOpen = true"
    >
      <VImg
        v-if="hasPoster"
        :src="poster"
        height="100%"
        cover
        @error="hasPosterFailed = true"
      />
      <span v-if="hasPoster" class="veil"></span>
      <VAvatar class="badge" color="surface" size="48" tag="span">
        <VIcon :icon="icon" size="26" />
      </VAvatar>
    </button>
  </div>
</template>

<script lang="ts" setup>
// A shared video or document
import type { LinkEmbed } from '@tailor-cms/utils';
import { LinkContentType } from '@tailor-cms/interfaces/asset';

const props = defineProps<{
  embed: LinkEmbed;
  title?: string;
  poster?: string;
}>();

const ALLOW = [
  'accelerometer',
  'autoplay',
  'clipboard-write',
  'encrypted-media',
  'fullscreen',
  'gyroscope',
  'picture-in-picture',
  'web-share',
].join('; ');

const isOpen = ref(false);
const hasPosterFailed = ref(false);

const isVideo = computed(() => props.embed.kind === LinkContentType.Video);
const hasPoster = computed(() => !!props.poster && !hasPosterFailed.value);
const aspectRatio = computed(() => (isVideo.value ? '16 / 9' : '4 / 3'));

const src = computed(() => {
  const url = new URL(props.embed.embedUrl);
  if (isVideo.value) url.searchParams.set('autoplay', '1');
  return url.href;
});

const icon = computed(() =>
  isVideo.value ? 'mdi-play' : 'mdi-file-eye-outline',
);
const name = computed(
  () => props.title || (isVideo.value ? 'Video' : 'Document'),
);
const label = computed(
  () => `${isVideo.value ? 'Play' : 'Open'} ${name.value}`,
);

watch(
  () => props.embed.embedUrl,
  () => (isOpen.value = false),
);
watch(
  () => props.poster,
  () => (hasPosterFailed.value = false),
);
</script>

<style lang="scss" scoped>
.embed-frame {
  position: relative;
  overflow: hidden;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.5rem;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.embed-content {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.poster {
  padding: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: -2px;
  }
}

.veil {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.16);
  transition: background 0.15s ease;
}

.badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: transform 0.15s ease;
}

.poster:hover {
  .veil {
    background: rgba(0, 0, 0, 0.3);
  }

  .badge {
    transform: translate(-50%, -50%) scale(1.06);
  }
}
</style>
