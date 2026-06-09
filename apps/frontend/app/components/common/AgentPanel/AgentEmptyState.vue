<template>
  <div class="empty-state d-flex flex-column align-center text-center py-5 px-3">
    <button
      type="button"
      class="renoir"
      aria-label="Renoir strikes a new pose"
      @click="shuffle"
    >
      <span
        class="renoir-halo"
        :style="{ '--halo': `var(--v-theme-${accent})` }"
        aria-hidden="true"
      />
      <span class="renoir-float">
        <Transition name="pose" mode="out-in" appear>
          <img
            :key="pose"
            alt="Renoir"
            :src="`/img/renoir/pose-${pose}.png`"
            draggable="false"
            class="renoir-img"
          />
        </Transition>
      </span>
    </button>
    <div class="text-title-large font-weight-semibold my-2">
      Bonjour! I'm Renoir.
    </div>
    <VSheet class="text-body-medium text-medium-emphasis" max-width="350">
      Your authoring assistant. Try a slash command, or ask me anything about
      this repository. I see what's open in the editor and can act on it
      directly.
    </VSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useIntervalFn, usePreferredReducedMotion } from '@vueuse/core';
import { range, sample, without } from 'lodash-es';

const IDLE_INTERVAL = 7000;
const POSES = range(1, 11); // [1..10]
const ACCENTS = ['primary', 'secondary', 'tertiary'];

const randomPose = (exclude?: number) => sample(without(POSES, exclude)) ?? 1;
const randomAccent = (exclude?: string) =>
  sample(without(ACCENTS, exclude)) ?? ACCENTS[0];

const pose = ref(randomPose());
const accent = ref(randomAccent());

const reducedMotion = usePreferredReducedMotion();

const cycle = () => {
  pose.value = randomPose(pose.value);
  accent.value = randomAccent(accent.value);
};

const { pause, resume } = useIntervalFn(cycle, IDLE_INTERVAL, { immediate: false });

watch(
  reducedMotion,
  (value) => (value === 'reduce' ? pause() : resume()),
  { immediate: true },
);

const shuffle = () => {
  cycle();
  // resume() restarts the countdown so a manual poke isn't immediately overridden.
  if (reducedMotion.value !== 'reduce') resume();
};
</script>

<style scoped lang="scss">
.renoir {
  position: relative;
  cursor: pointer;
  background: none;
  border: 0;
  padding: 0;
  border-radius: 50%;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: scale(1.05) rotate(-2deg);
  }

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 4px;
  }
}

.renoir-halo {
  position: absolute;
  bottom: 15px;
  left: 50%;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 50% 40%,
    rgba(var(--halo), 0.35),
    rgba(var(--halo), 0.12) 70%,
    transparent 72%
  );
  transform: translateX(-50%);
  pointer-events: none;
}

.renoir-float {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 160px;
  height: 160px;
  animation: renoir-bob 4s ease-in-out infinite;
}

.renoir-img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

// Each new pose pops in with a little squash-and-stretch.
.pose-enter-active {
  animation: renoir-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pose-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.pose-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@keyframes renoir-bob {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-6px) rotate(0.6deg);
  }
}

@keyframes renoir-pop {
  0% {
    opacity: 0;
    transform: scale(0.6) rotate(-8deg);
  }
  60% {
    opacity: 1;
    transform: scale(1.08) rotate(3deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .renoir,
  .renoir-float,
  .pose-enter-active,
  .pose-leave-active {
    animation: none;
    transition: none;
  }
}
</style>
