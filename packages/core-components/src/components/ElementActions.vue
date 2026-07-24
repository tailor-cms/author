<template>
  <div class="element-actions">
    <VExpandXTransition>
      <div v-if="element.isLinkedCopy" class="pinned">
        <ElementLinkedIndicator
          :is-entry-point="isEntryPoint"
          :is-loading="isLoadingSourceInfo"
          :source-info="linkedSourceInfo"
          @source:fetch="emit('source:fetch')"
          @source:view="emit('navigate', $event)"
          @unlink="emit('unlink')"
        />
      </div>
    </VExpandXTransition>
    <VExpandXTransition>
      <div v-if="showUsages && isHighlighted">
        <ElementSourceUsages
          :element="element"
          :is-loading="isLoadingUsages"
          :usages="usages"
          @usage:view="emit('navigate', $event)"
          @usages:fetch="emit('usages:fetch')"
        />
      </div>
    </VExpandXTransition>
    <VExpandXTransition>
      <div
        v-if="showDiscussion && (isHighlighted || hasComments)"
        class="pinned"
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
    </VExpandXTransition>
    <VExpandXTransition>
      <VDivider
        v-if="hasDivider && isHighlighted"
        class="action-divider"
        vertical
      />
    </VExpandXTransition>
    <VExpandXTransition>
      <div v-if="isHighlighted" class="action-reset">
        <VBtn
          v-tooltip:bottom="{ text: 'Reset element', openDelay: 1000 }"
          aria-label="Reset element"
          color="warning"
          icon="mdi-restore"
          size="x-small"
          variant="tonal"
          @click="emit('reset')"
        />
      </div>
    </VExpandXTransition>
    <VExpandXTransition>
      <div v-if="showDelete && isHighlighted" class="action-delete">
        <VBtn
          v-tooltip:bottom="{ text: 'Delete element', openDelay: 1000 }"
          aria-label="Delete element"
          color="error"
          icon="mdi-trash-can-outline"
          size="x-small"
          variant="tonal"
          @click="emit('delete')"
        />
      </div>
    </VExpandXTransition>
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

const hasDivider = computed(
  () =>
    props.element.isLinkedCopy || showUsages.value || props.showDiscussion,
);
</script>

<style lang="scss" scoped>
.element-actions {
  display: flex;
  align-items: center;
  gap: 0.125rem;

  > * {
    flex-shrink: 0;
  }

  // Quiet ghost buttons; the row whispers, semantic color appears only on
  // the hovered action itself.
  :deep(.v-btn) {
    border-radius: 8px;
    background: transparent;
    color: rgba(var(--v-theme-on-surface), 0.65);

    .v-btn__underlay {
      opacity: 0;
    }

    &:hover {
      background: rgba(var(--v-theme-on-surface), 0.06);
      color: rgba(var(--v-theme-on-surface), 0.95);
    }
  }

  :deep(.v-btn--icon.v-btn--size-x-small) {
    --v-btn-height: 1rem;
  }

  :deep(.v-btn--size-x-small .v-icon) {
    font-size: 1.125rem;
  }

  :deep(.v-badge__badge) {
    height: 0.875rem;
    min-width: 0.875rem;
    padding: 0 0.25rem;
    font-size: 0.5625rem;
  }

  .action-reset :deep(.v-btn:hover) {
    color: rgb(var(--v-theme-warning));
  }

  .action-delete :deep(.v-btn:hover) {
    color: rgb(var(--v-theme-error));
  }

  .action-divider {
    align-self: center;
    height: 1rem;
    margin-inline: 0.25rem;
  }
}
</style>
