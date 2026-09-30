<template>
  <div class="message-attachments d-flex flex-column ga-2">
    <VCard
      v-for="(attachment, index) in attachments"
      :key="index"
      :style="{ borderInlineStartColor: barColor(attachment) }"
      class="attachment pa-3"
      variant="tonal"
    >
      <div
        v-if="attachment.pretext"
        class="text-body-small text-medium-emphasis mb-1"
      >
        {{ attachment.pretext }}
      </div>
      <component
        :is="attachment.title_link ? 'a' : 'div'"
        v-if="attachment.title"
        :href="attachment.title_link"
        class="d-block text-label-large font-weight-semibold"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ attachment.title }}
      </component>
      <MessageBody
        v-if="attachment.text"
        :content="attachment.text"
        class="attachment-text text-body-medium mt-1"
      >
        <template #reference="{ token, icon }">
          <ReferenceChip :icon="icon" :token="token" />
        </template>
      </MessageBody>
      <AssetStrip
        v-if="attachment.tailor_previews?.length"
        :previews="attachment.tailor_previews"
        :total="attachment.tailor_previews_total"
        class="mt-3"
      />
      <div v-if="attachment.fields?.length" class="attachment-fields mt-2">
        <div
          v-for="(field, i) in attachment.fields"
          :key="i"
          :class="{ 'attachment-field--short': field.short }"
          class="attachment-field"
        >
          <div class="text-body-small text-medium-emphasis">
            {{ field.title }}
          </div>
          <div class="text-body-medium">{{ field.value }}</div>
        </div>
      </div>
      <div
        v-if="attachment.footer"
        class="text-body-small text-medium-emphasis mt-2">
        {{ attachment.footer }}
      </div>
    </VCard>
  </div>
</template>

<script lang="ts" setup>
import type { Attachment } from '@tailor-cms/interfaces/comment';

import { MessageBody } from '@tailor-cms/core-components';
import { useTheme } from 'vuetify';

import ReferenceChip from '../ReferenceChip.vue';
import AssetStrip from './AssetStrip.vue';

defineProps<{ attachments: Attachment[] }>();

const SLACK_COLORS: Record<string, string> = {
  good: 'success',
  warning: 'warning',
  danger: 'error',
};

const theme = useTheme();

const barColor = (attachment: Attachment) => {
  const color = attachment.color || 'info';
  const name = SLACK_COLORS[color] ?? color;
  if (!(name in theme.current.value.colors)) return color;
  return `rgb(var(--v-theme-${name}))`;
};
</script>

<style lang="scss" scoped>
.attachment {
  border-inline-start-style: solid;
  border-inline-start-width: 0.1875rem;
  border-start-start-radius: 0.25rem;
  border-end-start-radius: 0.25rem;
}

.attachment-text {
  white-space: pre-line;
}

.attachment-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
}

.attachment-field {
  flex: 1 1 100%;

  &--short {
    flex: 0 1 45%;
  }
}
</style>
