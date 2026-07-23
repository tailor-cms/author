<template>
  <div aria-label="Loading" class="circular-progress" role="status">
    <svg aria-hidden="true" class="ring" viewBox="0 0 68 68">
      <defs>
        <mask
          :id="maskId"
          height="68"
          width="68"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
        >
          <circle
            class="seam"
            cx="34"
            cy="34"
            fill="none"
            pathLength="126"
            r="31"
            stroke="#fff"
            stroke-dasharray="80 200"
            stroke-linecap="round"
            stroke-width="5"
          />
        </mask>
      </defs>
      <circle
        class="track"
        cx="34"
        cy="34"
        fill="none"
        r="31" />
      <g class="rotator">
        <circle
          :mask="`url(#${maskId})`"
          class="stitches"
          cx="34"
          cy="34"
          fill="none"
          r="31"
          stroke-dasharray="6.5 6.5"
        />
      </g>
    </svg>
    <img :src="logoUrl" alt="" class="mark" width="34" />
  </div>
</template>

<script lang="ts" setup>
import { useId } from 'vue';

const logoUrl = new URL('../assets/logo.svg', import.meta.url).href;
const maskId = `circular-progress-seam-${useId()}`;
</script>

<style lang="scss" scoped>
.circular-progress {
  position: relative;
  width: 4.25rem;
  height: 4.25rem;
  margin-inline: auto;
}

.ring {
  position: absolute;
  inset: 0;
}

.track {
  stroke: rgb(var(--v-theme-outline));
  stroke-width: 2.5;
  opacity: 0.2;
}

.stitches {
  stroke: rgb(var(--v-theme-outline));
  stroke-width: 2.5;
}

.rotator {
  animation: rotate 2s linear infinite;
  transform-origin: 2.125rem 2.125rem;
}

.seam {
  animation: sew 1.5s ease-in-out infinite;
}

.mark {
  position: absolute;
  inset: 0;
  margin: auto;
  animation:
    shimmer 2.4s ease-in-out infinite alternate,
    pulse 1.6s ease-in-out infinite alternate;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes sew {
  0% {
    stroke-dasharray: 1 200;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 89 200;
    stroke-dashoffset: -35;
  }

  100% {
    stroke-dasharray: 89 200;
    stroke-dashoffset: -124;
  }
}

@keyframes shimmer {
  from {
    filter: hue-rotate(-14deg) saturate(0.95);
  }

  to {
    filter: hue-rotate(14deg) saturate(1.15);
  }
}

@keyframes pulse {
  from {
    transform: scale(0.98);
  }

  to {
    transform: scale(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rotator,
  .seam,
  .mark {
    animation: none;
  }
}
</style>
