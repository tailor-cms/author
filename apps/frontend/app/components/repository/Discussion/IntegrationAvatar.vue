<template>
  <VAvatar
    :color="isBuiltin ? 'surface-container-high' : 'secondary'"
    :size="size"
    :variant="isBuiltin ? 'flat' : 'tonal'"
    rounded="lg"
  >
    <img
      v-if="imageSrc"
      :src="imageSrc"
      :style="{ width: `${iconSize}px`, height: `${iconSize}px` }"
      alt=""
      class="integration-avatar-image"
    >
    <span v-else-if="emojiText" :style="{ fontSize: `${iconSize}px` }">
      {{ emojiText }}
    </span>
    <VIcon v-else :icon="integration?.icon ?? 'mdi-webhook'" :size="iconSize" />
  </VAvatar>
</template>

<script lang="ts" setup>
import type { IntegrationRef } from '@tailor-cms/interfaces/comment';

import { emojiChar } from '@tailor-cms/core-components';
import { IntegrationType } from '@tailor-cms/interfaces/comment';

const props = withDefaults(
  defineProps<{
    integration?: IntegrationRef | null;
    emoji?: string | null;
    size?: number;
  }>(),
  { integration: null, emoji: null, size: 32 },
);

const LOGO_URL = '/img/logo-new.svg';
const ICON_SCALE = 0.62;

const emojiStore = useEmojiStore();

const isBuiltin = computed(
  () => props.integration?.type !== IntegrationType.External,
);

const imageSrc = computed(() => {
  const custom = props.emoji ? emojiStore.get(props.emoji) : undefined;
  return custom?.url ?? (isBuiltin.value ? LOGO_URL : undefined);
});

const emojiText = computed(() => props.emoji && emojiChar(props.emoji));

const iconSize = computed(() => Math.round(props.size * ICON_SCALE));
</script>

<style lang="scss" scoped>
.integration-avatar-image {
  object-fit: contain;
}
</style>
