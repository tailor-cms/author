<template>
  <div class="link-embed">
    <VResponsive :aspect-ratio="16 / 9">
      <iframe
        v-if="isOpen"
        :allow="ALLOW"
        :src="embed.src"
        :title="title"
        allowfullscreen
        class="frame"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
      <button
        v-else
        :aria-label="label"
        class="poster"
        type="button"
        @click="isOpen = true"
      >
        <VImg
          v-if="poster"
          :src="poster"
          cover
          height="100%"
          @error="emit('poster:error')"
        />
        <span class="veil"></span>
        <VAvatar class="badge" color="surface" size="48" tag="span">
          <VIcon :icon="icon" size="26" />
        </VAvatar>
      </button>
    </VResponsive>
  </div>
</template>

<script lang="ts" setup>
import type { Embed } from './embeds';

const props = defineProps<{
  embed: Embed;
  title?: string;
  poster?: string;
}>();

const emit = defineEmits<{ 'poster:error': [] }>();

const ALLOW = [
  'accelerometer',
  'autoplay',
  'encrypted-media',
  'picture-in-picture',
  'fullscreen',
].join('; ');

const isOpen = ref(false);
const isPlayable = computed(() => props.embed.action === 'play');
const icon = computed(() =>
  isPlayable.value ? 'mdi-play' : 'mdi-file-eye-outline',
);
const label = computed(() =>
  isPlayable.value ? 'Play video' : 'Open preview',
);
</script>

<style lang="scss" scoped>
.link-embed {
  overflow: hidden;
  border-radius: 0.5rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.frame {
  width: 100%;
  height: 100%;
  border: 0;
}

.poster {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
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
