<template>
  <div class="message-body">
    <template v-for="(segment, index) in segments" :key="index">
      <span v-if="segment.kind === 'codeblock'" class="code-block">
        <span v-if="segment.language" class="code-language">
          {{ segment.language }}
        </span>
        <pre><code>{{ segment.text }}</code></pre>
      </span>
      <code
        v-else-if="segment.kind === 'code'"
        class="code-inline"
      >{{ segment.text }}</code>
      <a
        v-else-if="segment.kind === 'link'"
        :href="segment.href"
        class="message-link"
        rel="noopener noreferrer nofollow"
        target="_blank"
      >{{ segment.text }}</a>
      <MessageToken
        v-else-if="segment.kind === 'mention'"
        :is-self="isCurrentUser(segment)"
        :label="segment.label"
        kind="mention"
      />
      <component
        :is="referenceView"
        v-else-if="segment.kind === 'reference'"
        :icon="referenceIcon(segment.entityType)"
        :token="segment"
      />
      <EmojiGlyph v-else-if="segment.kind !== 'text'" :value="segment.text" />
      <span v-else>{{ segment.text }}</span>
    </template>
    <!-- Inside the body, so it wraps with the last word -->
    <span v-if="isEdited" class="ms-1 text-body-small text-medium-emphasis">
      (edited)
    </span>
  </div>
</template>

<script lang="ts" setup>
import {
  type MarkupSegment,
  type MentionToken,
  type MessageToken as Token,
  type ReferenceToken,
  type SplitEmojiSegment,
  linkify,
  parseMarkup,
  parseMessage,
  splitEmoji,
} from '@tailor-cms/utils';
import { type FunctionalComponent, computed, h } from 'vue';
import { type ReferenceChipProps, useDiscussionContext } from './context';
import { referenceIcon } from './referenceIcon';
import EmojiGlyph from './EmojiGlyph.vue';
import MessageToken from './MessageToken.vue';

// The text of a message: words, code, links, emoji, mentions and
// references
interface Props {
  content?: string;
  currentUserId?: number | null;
  isEdited?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  currentUserId: null,
  isEdited: false,
});

// Without the app's chip, a reference is a plain token
const PlainReference: FunctionalComponent<ReferenceChipProps> = (
  { token, icon },
) => h(MessageToken, { kind: 'reference', label: token.label, icon });

// In the app a reference links to its target and previews it on hover
const referenceView =
  useDiscussionContext().referenceViews?.chip ?? PlainReference;

// Words, an emoji or a link
interface TextSegment extends Omit<SplitEmojiSegment, 'kind'> {
  kind: SplitEmojiSegment['kind'] | 'link';
  href?: string;
}

type Segment = MarkupSegment | TextSegment | MentionToken | ReferenceToken;

const textSegments = (text: string): TextSegment[] =>
  linkify(text).flatMap<TextSegment>(({ text: value, href }) =>
    href ? [{ kind: 'link', text: value, href }] : splitEmoji(value),
  );

const toSegments = (token: Token): Segment[] => {
  if (token.kind !== 'text') return [token];
  return parseMarkup(token.text).flatMap<Segment>((segment) =>
    segment.kind === 'text' ? textSegments(segment.text) : [segment],
  );
};

// Everything drawn, in order
const segments = computed(() =>
  parseMessage(props.content.trimEnd()).flatMap(toSegments),
);

const isCurrentUser = ({ userId }: MentionToken) =>
  userId === props.currentUserId;
</script>

<style lang="scss" scoped>
.message-body {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
}

// Typed as backticks, shown as code
.code-inline {
  padding: 0.0625rem 0.25rem;
  border: thin solid rgba(var(--v-theme-tertiary), 0.28);
  border-radius: 0.25rem;
  background: rgba(var(--v-theme-tertiary), 0.1);
  color: rgb(var(--v-theme-on-tertiary-container));
  font-size: 0.8125em;
  overflow-wrap: anywhere;
}

.code-block {
  display: block;
  margin: 0.375rem 0;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.5rem;
  background: rgba(var(--v-theme-on-surface), 0.04);

  pre {
    margin: 0;
    padding: 0.375rem 0.625rem 0.5rem;
    overflow-x: auto;
    font-size: 0.8125em;
    white-space: pre;
  }
}

.code-language {
  display: inline-block;
  margin: 0.375rem 0.625rem 0;
  padding: 0 0.25rem;
  border-radius: 0.25rem;
  background: rgba(var(--v-theme-tertiary), 0.16);
  color: rgb(var(--v-theme-on-tertiary-container));
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

// A URL is linked when shown, not stored as a token
.message-link {
  color: rgb(var(--v-theme-info));
  text-decoration: underline;
  text-decoration-color: rgba(var(--v-theme-info), 0.4);
  text-underline-offset: 0.125em;
  overflow-wrap: anywhere;

  &:hover {
    text-decoration-color: currentcolor;
  }
}
</style>
