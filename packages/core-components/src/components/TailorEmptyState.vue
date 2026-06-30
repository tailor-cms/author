<template>
  <VCard
    v-bind="$attrs"
    :color="color"
    :rounded="rounded"
    :height="height"
    :variant="variant"
    class="py-12"
  >
    <VEmptyState
      v-bind="{ actionText, icon, headline, href, text, title, size, image, textWidth }"
      @click:action="emit('click:action')"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}"></slot>
      </template>
    </VEmptyState>
  </VCard>
</template>

<script lang="ts" setup>
import type { VCard, VEmptyState } from 'vuetify/components';

export interface Props {
  actionText?: string;
  color?: string;
  headline?: string;
  height?: number | string;
  href?: string;
  icon?: string;
  image?: string;
  rounded?: VCard['rounded'];
  size?: VEmptyState['size'];
  text?: string;
  title?: string;
  textWidth?: string | number;
  variant?: VCard['variant'];
}
defineOptions({ inheritAttrs: false });
withDefaults(defineProps<Props>(), {
  rounded: 'lg',
  size: '64',
  variant: 'tonal',
});

const emit = defineEmits<{ 'click:action': [] }>();
</script>

<style lang="scss" scoped>
:deep(.v-card__underlay) {
  opacity: 0.03;
}

:deep(.v-empty-state__title) {
  font-weight: 500;
}

:deep(.v-empty-state__media) {
  margin-bottom: 1rem;
}

:deep(.v-empty-state__media .v-icon) {
  color: color-mix(
    in srgb,
    currentColor calc(var(--v-medium-emphasis-opacity) * 100%),
    transparent
  );
}
</style>
