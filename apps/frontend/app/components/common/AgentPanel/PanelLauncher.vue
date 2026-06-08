<template>
  <button
    type="button"
    class="panel-launcher"
    :class="{ 'is-running': isRunning }"
    aria-label="Open assistant"
    @click="$emit('open')"
  >
    <LauncherParticles v-if="isRunning" :size="64" />
    <img class="launcher-head" :src="image" alt="" draggable="false" />
  </button>
</template>

<script lang="ts" setup>
import LauncherParticles from './LauncherParticles.vue';

interface Props {
  isRunning?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isRunning: false });
defineEmits<{ open: [] }>();

const image = computed(() => {
  if (props.isRunning) return '/img/renoir/thinking.gif';
  return '/img/renoir/head.png';
});
</script>

<style lang="scss" scoped>
$size: 64px;

.panel-launcher {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: $size;
  height: $size;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  // Let the particles spill outside the button box.
  overflow: visible;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: none;

    .launcher-head {
      box-shadow:
        0 0 0 3px rgb(var(--v-theme-surface)),
        0 0 0 5px rgb(var(--v-theme-secondary));
    }
  }
}

// The head — floating, gently bobbing, with a soft cast shadow.
.launcher-head {
  position: relative;
  width: 80%;
  height: 80%;
  border-radius: 50%;
  object-fit: cover;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
  animation: launcher-bob 4.5s ease-in-out infinite;
  transition:
    filter 0.3s ease,
    width 0.3s ease,
    height 0.3s ease;
}

.panel-launcher:hover .launcher-head {
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.4));
}

// While running, the head grows and bobs faster.
.panel-launcher.is-running {
  bottom: -1rem;

  .launcher-head {
    width: 115%;
    height: 115%;
    animation-duration: 2.4s;
  }
}

@keyframes launcher-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .launcher-head {
    animation: none;
  }
}
</style>
