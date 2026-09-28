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
      <div class="body">
        <MessageBody
          :content="isImageOnly ? '' : content"
          :current-user-id="currentUserId"
        >
          <template v-if="referenceViews" #reference="{ token, icon }">
            <component :is="referenceViews.chip" :icon="icon" :token="token" />
          </template>
          <template #trailing>
            <span v-if="isEdited" class="edited text-medium-emphasis">
              (edited)
            </span>
          </template>
        </MessageBody>
      </div>
      <component
        :is="referenceViews.previews"
        v-if="referenceViews"
        v-model:is-image-only="isImageOnly"
        :content="content"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useDiscussionContext } from '../../context';
import MessageBody from '../../MessageBody.vue';

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

const isImageOnly = ref(false);
</script>

<style lang="scss" scoped>
.edited {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}

.content .body {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
}

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
