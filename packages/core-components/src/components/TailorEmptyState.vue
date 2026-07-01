<template>
  <VCard
    v-bind="$attrs"
    :color="color"
    :rounded="rounded"
    :height="height"
    :variant="variant"
  >
    <VEmptyState
      v-bind="{ icon, headline, text, title, size, image, textWidth }"
      @click:action="emit('click:action')"
    >
      <template v-if="$slots.media" #media>
        <slot name="media" />
      </template>
      <template v-if="$slots.headline" #headline>
        <slot name="headline" />
      </template>
      <template v-if="$slots.title" #title>
        <slot name="title" />
      </template>
      <template v-if="$slots.text" #text>
        <slot name="text" />
      </template>
      <template v-if="$slots.default" #default>
        <slot />
      </template>
      <template v-if="actionText || $slots.actions" #actions>
        <slot name="actions" />
        <VBtn
          v-if="actionText"
          :text="actionText"
          :href="href"
          :to="to"
          :prepend-icon="prependActionIcon"
          :append-icon="appendActionIcon"
          variant="flat"
          @click="emit('click:action')"
        />
      </template>
    </VEmptyState>
  </VCard>
</template>

<script lang="ts" setup>
import type { VBtn, VCard, VEmptyState } from 'vuetify/components';

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
  to?: VBtn['to'];
  textWidth?: string | number;
  appendActionIcon?: string;
  prependActionIcon?: string;
  variant?: VCard['variant'];
}
defineOptions({ inheritAttrs: false });
withDefaults(defineProps<Props>(), {
  rounded: 'lg',
  size: '64',
  height: '300',
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
