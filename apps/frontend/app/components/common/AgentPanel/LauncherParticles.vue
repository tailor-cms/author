<template>
  <span
    class="launcher-particles"
    :style="{ '--size': `${size}px` }"
    aria-hidden="true"
  >
    <i
      v-for="p in PARTICLES"
      :key="p['--a']"
      class="launcher-particles-dot"
      :style="p"
    />
  </span>
</template>

<script lang="ts" setup>
interface Props {
  // Diameter the orbit is sized against (px); radii are a fraction of it.
  size?: number;
}

withDefaults(defineProps<Props>(), { size: 64 });

// Radii are a fraction of `--size`, so the ring scales with the host.
// Scattered angles / speeds / theme-accent colors for an organic orbit.
const PARTICLES = [
  {
    '--factor': '0.625',
    '--a': '0deg',
    '--dur': '7s',
    '--delay': '0s',
    '--c': 'rgb(var(--v-theme-secondary))',
    'width': '5px',
    'height': '5px',
  },
  {
    '--factor': '0.531',
    '--a': '140deg',
    '--dur': '9s',
    '--delay': '-2s',
    '--c': 'rgb(var(--v-theme-primary))',
    'width': '4px',
    'height': '4px',
  },
  {
    '--factor': '0.672',
    '--a': '250deg',
    '--dur': '8s',
    '--delay': '-4s',
    '--c': 'rgb(var(--v-theme-tertiary))',
    'width': '3px',
    'height': '3px',
  },
  {
    '--factor': '0.469',
    '--a': '60deg',
    '--dur': '6s',
    '--delay': '-1s',
    '--c': 'rgb(var(--v-theme-primary))',
    'width': '3px',
    'height': '3px',
  },
  {
    '--factor': '0.703',
    '--a': '200deg',
    '--dur': '11s',
    '--delay': '-6s',
    '--c': 'rgb(var(--v-theme-secondary))',
    'width': '5px',
    'height': '5px',
  },
];
</script>

<style lang="scss" scoped>
// Overlay that fills its (positioned) host; dots orbit around the center.
.launcher-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.launcher-particles-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  // Park the dot at the top of a ring (radius = size × factor), then
  // rotate the whole frame so it travels a circle.
  transform: translate(-50%, -50%) rotate(var(--a, 0deg))
    translateY(calc(-1 * var(--size, 64px) * var(--factor, 0.6)));
  animation: launcher-particles-orbit var(--dur, 7s) linear infinite;
  animation-delay: var(--delay, 0s);
}

.launcher-particles-dot::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--c, rgb(var(--v-theme-secondary)));
  box-shadow: 0 0 6px 1px var(--c, rgb(var(--v-theme-secondary)));
}

@keyframes launcher-particles-orbit {
  to {
    transform: translate(-50%, -50%) rotate(calc(var(--a, 0deg) + 360deg))
      translateY(calc(-1 * var(--size, 64px) * var(--factor, 0.6)));
  }
}

@media (prefers-reduced-motion: reduce) {
  .launcher-particles-dot {
    animation: none;
  }
}
</style>
