<template>
  <div :class="{ comfortable }" class="element-actions-column">
    <div v-if="element.isLinkedCopy" class="is-visible">
      <ElementLinkedIndicator
        :is-entry-point="isEntryPoint"
        :is-loading="isLoadingSourceInfo"
        :source-info="linkedSourceInfo"
        @source:fetch="emit('source:fetch')"
        @source:view="emit('navigate', $event)"
        @unlink="emit('unlink')"
      />
    </div>
    <div v-if="showUsages" :class="{ 'is-visible': isHighlighted }">
      <ElementSourceUsages
        :element="element"
        :is-loading="isLoadingUsages"
        :usages="usages"
        @usage:view="emit('navigate', $event)"
        @usages:fetch="emit('usages:fetch')"
      />
    </div>
    <div
      v-if="showDiscussion"
      :class="{
        'is-visible': isHighlighted || hasComments,
        'pinned-first': hasComments,
      }"
    >
      <ElementLinkedDiscussion
        v-if="element.isLinkedCopy"
        :is-loading="isLoadingSourceInfo"
        :source-info="linkedSourceInfo"
        @source:fetch="emit('source:fetch')"
        @source:view="emit('navigate', $event)"
      />
      <ElementDiscussion
        v-else
        v-bind="element"
        :user="currentUser"
        @open="emit('discussion:open')"
      />
    </div>
    <div :class="{ 'is-visible': isHighlighted }">
      <VBtn
        v-tooltip:left="{ text: 'Reset element', openDelay: 1000 }"
        aria-label="Reset element"
        color="warning"
        icon="mdi-restore"
        size="x-small"
        variant="tonal"
        @click="emit('reset')"
      />
    </div>
    <div v-if="showDelete" :class="{ 'is-visible': isHighlighted }">
      <VBtn
        v-tooltip:left="{ text: 'Delete element', openDelay: 1000 }"
        aria-label="Delete element"
        color="error"
        icon="mdi-trash-can-outline"
        size="x-small"
        variant="tonal"
        @click="emit('delete')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {
  ContentElement,
  ElementSourceInfo,
} from '@tailor-cms/interfaces/content-element';
import type { User } from '@tailor-cms/interfaces/user';
import { computed } from 'vue';

import ElementDiscussion from './ElementDiscussion.vue';
import ElementLinkedDiscussion from './ElementLinkedDiscussion.vue';
import ElementLinkedIndicator from './ElementLinkedIndicator.vue';
import ElementSourceUsages from './ElementSourceUsages.vue';

interface Props {
  element: ContentElement;
  currentUser?: User | null;
  linkedSourceInfo?: ElementSourceInfo | null;
  usages?: ElementSourceInfo[] | null;
  isHighlighted?: boolean;
  isEntryPoint?: boolean;
  isLoadingSourceInfo?: boolean;
  isLoadingUsages?: boolean;
  showDiscussion?: boolean;
  showDelete?: boolean;
  comfortable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentUser: null,
  linkedSourceInfo: null,
  usages: null,
  isHighlighted: false,
  isEntryPoint: true,
  isLoadingSourceInfo: false,
  isLoadingUsages: false,
  showDiscussion: false,
  showDelete: true,
  comfortable: false,
});

const emit = defineEmits([
  'delete',
  'discussion:open',
  'navigate',
  'reset',
  'source:fetch',
  'unlink',
  'usages:fetch',
]);

const hasComments = computed(() => !!props.element.comments?.length);
const showUsages = computed(
  () => !props.element.isLinkedCopy && !props.element.embedded,
);
</script>

<style lang="scss" scoped>
.element-actions-column {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  position: absolute;
  top: -0.0625rem;
  right: -2.5rem;
  width: 3rem;
  height: 100%;
  padding-left: 0.75rem;

  > * {
    flex-shrink: 0;
    min-height: 1.5rem;
    opacity: 0;
    transition: opacity 0.1s linear;
  }

  > .is-visible {
    opacity: 1;
    transition: opacity 0.5s linear;
  }

  // With comments the icon stays visible while the row isn't hovered, so
  // pin it to the top instead of leaving it below hidden hover-only actions.
  > .pinned-first {
    order: -1;
  }

  // More of vertical spacing when the host element has room; compact hosts
  // keep the tight stack.
  &.comfortable {
    gap: 0.625rem;
  }

  :deep(.v-btn--icon.v-btn--size-x-small) {
    --v-btn-height: 0.875rem;
  }

  :deep(.v-btn--size-x-small .v-icon) {
    font-size: 1.25rem;
  }
}
</style>
