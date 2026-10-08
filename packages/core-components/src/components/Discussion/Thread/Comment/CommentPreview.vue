<template>
  <div :class="{ resolved: isResolved }" class="content mt-1 text-body-medium">
    <span v-if="isDeleted" class="deleted text-medium-emphasis font-italic">
      This comment was deleted.
    </span>
    <template v-else>
      <div v-if="isResolved" class="resolvement-options">
        <span class="font-italic mr-1">Marked as resolved.</span>
        <VBtn
          v-tooltip:right="{ text: 'Unresolve comment', openDelay: 800 }"
          class="ml-1"
          color="secondary"
          size="x-small"
          text="Undo"
          variant="tonal"
          @click.stop="emit('unresolve')"
        />
      </div>
      <component :is="previews" :content="content">
        <MessageBody
          :content="content"
          :current-user-id="currentUserId"
          :is-edited="isEdited"
        />
      </component>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { FunctionalComponent } from 'vue';

import { useDiscussionContext } from '../../context';
import MessageBody from '../../Message/MessageBody.vue';

interface Props {
  content?: string;
  currentUserId?: number | null;
  isResolved?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
}

withDefaults(defineProps<Props>(), {
  content: '',
  currentUserId: null,
  isResolved: false,
  isDeleted: false,
  isEdited: false,
});

const emit = defineEmits(['unresolve']);

const { referenceViews } = useDiscussionContext();

// Without the app's previews, just the text
const TextOnly: FunctionalComponent = (_, { slots }) => slots.default?.();

const previews = referenceViews?.previews ?? TextOnly;
</script>

<style lang="scss" scoped>
.content.resolved {
  opacity: 0.7;

  .resolvement-options {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
  }
}
</style>
