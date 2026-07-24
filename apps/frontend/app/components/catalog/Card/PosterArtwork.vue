<template>
  <!-- Sharp right, dissolving left via scrim + masked blurred copies -->
  <div aria-hidden="true" class="poster-artwork">
    <div
      v-for="variant in ['sharp', 'blur-1', 'blur-2', 'blur-3']"
      :key="variant"
      :class="`layer--${variant}`"
      class="layer"
    >
      <img :src="src" alt="" class="underlay" loading="lazy" />
      <img :src="src" alt="" class="cover" loading="lazy" />
    </div>
    <div class="scrim" />
  </div>
</template>

<script lang="ts" setup>
defineProps<{ src: string }>();
</script>

<style lang="scss" scoped>
// Fills the nearest positioned ancestor, behind its content.
.poster-artwork {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.layer {
  position: absolute;
  inset: 0;
}

// Mirrored reflection hinged at the 25% seam: same box as the cover
// (identical object-fit crop), right edge on the seam, flipped — the
// image's left column meets itself and continues leftward.
.underlay {
  position: absolute;
  top: 0;
  right: 75%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.cover {
  position: absolute;
  inset: 0;
  left: 25%;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

// Blur ramp toward the left edge. Masks also fade in from the left: any
// filtered-layer pixels touching the rounded clip leak a hairline edge.
@mixin blur-band($blur, $solid, $fade) {
  filter: blur($blur);
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 3%,
    black 10%,
    black $solid,
    transparent $fade
  );
  mask-image: linear-gradient(
    to right,
    transparent 3%,
    black 10%,
    black $solid,
    transparent $fade
  );
}

.layer--blur-1 { @include blur-band(3px, 42%, 68%); }
.layer--blur-2 { @include blur-band(10px, 28%, 52%); }
.layer--blur-3 { @include blur-band(22px, 12%, 34%); }

// Same left fade, same reason.
.layer--sharp {
  -webkit-mask-image: linear-gradient(to right, transparent 3%, black 10%);
  mask-image: linear-gradient(to right, transparent 3%, black 10%);
}

// Eased stops avoid banding. Must sit above the layers — inside a blurred
// one it smears and the artwork glows through near the edges.
.scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgb(var(--v-theme-surface-raised)) 0%,
    rgba(var(--v-theme-surface-raised), 0.97) 18%,
    rgba(var(--v-theme-surface-raised), 0.89) 30.6%,
    rgba(var(--v-theme-surface-raised), 0.76) 42.3%,
    rgba(var(--v-theme-surface-raised), 0.58) 54%,
    rgba(var(--v-theme-surface-raised), 0.38) 64.8%,
    rgba(var(--v-theme-surface-raised), 0.2) 74.7%,
    rgba(var(--v-theme-surface-raised), 0.07) 82.8%,
    transparent 90%
  );
}
</style>
