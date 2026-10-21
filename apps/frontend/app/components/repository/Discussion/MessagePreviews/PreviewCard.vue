<template>
  <VCard
    :class="`preview-card--${variant}`"
    :style="accent ? { borderInlineStartColor: accent } : undefined"
    class="preview-card d-flex ga-3 pa-3"
    max-width="34rem"
    variant="tonal"
  >
    <div class="preview-content flex-grow-1">
      <div v-if="site" class="d-flex align-center ga-1 mb-1">
        <VIcon v-if="accent" :color="accent" :icon="icon" size="13" />
        <img v-else-if="favicon" :src="favicon" alt="" class="preview-favicon">
        <VIcon v-else :icon="icon" size="12" />
        <span class="text-body-small text-medium-emphasis text-truncate">
          {{ site }}
        </span>
      </div>
      <component
        :is="href ? 'a' : 'span'"
        v-bind="linkAttrs"
        class="preview-title text-body-medium font-weight-bold"
      >
        {{ title }}
      </component>
      <p
        v-if="description"
        class="preview-description text-body-small mt-1 mb-0"
      >
        {{ description }}
      </p>
      <div v-if="$slots.media" class="mt-2">
        <slot name="media" />
      </div>
    </div>
    <a
      v-if="thumbnail"
      v-bind="linkAttrs"
      aria-hidden="true"
      class="flex-shrink-0"
      tabindex="-1"
    >
      <VImg
        :aspect-ratio="4 / 3"
        :src="thumbnail"
        rounded="lg"
        width="5rem"
        cover
        @error="emit('thumbnail:error')"
      />
    </a>
  </VCard>
</template>

<script lang="ts" setup>
// The card under a message for a shared file or a pasted link
const props = withDefaults(
  defineProps<{
    title: string;
    icon: string;
    variant?: 'link' | 'file';
    // A known service's brand colour
    accent?: string;
    site?: string;
    favicon?: string;
    description?: string;
    thumbnail?: string;
    href?: string;
    isExternal?: boolean;
  }>(),
  {
    variant: 'link',
    accent: undefined,
    site: undefined,
    favicon: undefined,
    description: undefined,
    thumbnail: undefined,
    href: undefined,
    isExternal: false,
  },
);

const emit = defineEmits<{ 'thumbnail:error': [] }>();

const linkAttrs = computed(() => ({
  href: props.href,
  ...(props.isExternal && {
    target: '_blank',
    rel: 'noopener noreferrer nofollow',
  }),
}));
</script>

<style lang="scss" scoped>
.preview-card {
  border-inline-start: 0.1875rem solid rgb(var(--v-theme-info));
  border-start-start-radius: 0.25rem;
  border-end-start-radius: 0.25rem;

  &--file {
    border-inline-start-color: rgb(var(--v-theme-secondary));
  }
}

.preview-content {
  min-width: 0;
}

.preview-favicon {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 0.25rem;
  object-fit: contain;
}

.preview-title {
  display: block;
  color: rgb(var(--v-theme-info));
  text-decoration: none;
  overflow-wrap: anywhere;

  &:hover {
    text-decoration: underline;
  }

  .preview-card--file & {
    color: rgb(var(--v-theme-on-surface));
  }
}

.preview-description {
  display: -webkit-box;
  overflow: hidden;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}
</style>
