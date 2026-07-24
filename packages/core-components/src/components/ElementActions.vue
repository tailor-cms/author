<template>
  <div class="element-actions">
    <VExpandXTransition>
      <div v-if="isRegistered && element.isLinkedCopy" class="pinned">
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
      <div v-if="isHighlighted && isRegistered" class="action-reset">
        <VBtn
          v-tooltip:bottom="{ text: 'Reset element', openDelay: 1000 }"
          aria-label="Reset element"
          color="warning"
          icon="mdi-restore"
          rounded="lg"
          size="x-small"
          variant="text"
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
          rounded="lg"
          size="x-small"
          variant="text"
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
  isRegistered?: boolean;
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
  isRegistered: true,
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
  () =>
    props.isRegistered &&
    !props.element.isLinkedCopy &&
    !props.element.embedded,
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

  :deep(.v-btn--icon.v-btn--size-x-small) {
    --v-btn-height: 1rem;
  }

  :deep(.v-btn--size-x-small .v-icon) {
    font-size: 1.125rem;
  }
}
</style>
