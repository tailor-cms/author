<template>
  <div class="header">
    <UserAvatar
      :img-url="comment.author.imgUrl"
      :size="36"
      class="ml-1 mt-2"
      color="secondary-lighten-2"
      rounded="lg"
    />
    <div class="info-container">
      <div class="d-flex align-center">
        <VTooltip location="right">
          <template #activator="{ props: tooltipProps }">
            <span
              v-bind="tooltipProps"
              class="author text-teal-lighten-5 text-truncate"
            >
              {{ comment.author.label }}
            </span>
          </template>
          {{ comment.author.label }}
        </VTooltip>
        <span v-if="showEditedLabel" class="edited ml-1">(edited)</span>
      </div>
      <div class="d-flex text-grey-lighten-2 align-center">
        <VTooltip location="right">
          <template #activator="{ props: tooltipProps }">
            <span v-bind="tooltipProps" class="text-subtitle-2">
              {{ formatDistanceToNow(comment.createdAt) }} ago
            </span>
          </template>
          <span>
            {{ formatDate(comment.createdAt, 'dd MMM HH:mm') }}
          </span>
        </VTooltip>
        <template v-if="isActivityThread && elementLabel">
          <VDivider vertical />
          <EditorLink
            :activity-id="comment.activityId"
            :element-uid="elementUid"
            :label="elementLabel"
          />
        </template>
      </div>
    </div>
    <div v-if="showOptions" class="actions">
      <VBtn
        v-for="({ action, icon, color }, name) in options"
        :key="name"
        :color="color"
        :icon="`mdi-${icon}`"
        class="ml-2"
        size="x-small"
        variant="tonal"
        @click="emit(action)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineEmits, defineProps } from 'vue';
import formatDate from 'date-fns/format';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import EditorLink from '../../../EditorLink.vue';
import UserAvatar from '../../..//UserAvatar.vue';

const props = defineProps({
  comment: { type: Object, required: true },
  isActivityThread: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
  elementLabel: { type: String, default: null },
  user: { type: Object, required: true },
});

const emit = defineEmits(['remove', 'resolve', 'toggleEdit']);

const getOptions = () => ({
  resolve: {
    action: 'resolve',
    icon: 'checkbox-outline',
    color: 'teal accent-4',
  },
  edit: {
    action: 'toggleEdit',
    icon: 'pencil-outline',
    color: 'teal-lighten-3',
  },
  remove: {
    action: 'remove',
    icon: 'trash-can-outline',
    color: 'secondary-lighten-3',
  },
});

const elementUid = computed(() => props.comment.contentElement?.uid);
const isAuthor = computed(() => props.comment.author?.id === props.user?.id);
const isDeleted = computed(() => !!props.comment.deletedAt);
const showEditedLabel = computed(() => !!props.comment.editedAt);
const showOptions = computed(
  () => isAuthor.value && !isDeleted.value && !props.isResolved,
);
const options = computed(() => {
  const options = getOptions();
  if (props.isActivityThread) delete options.resolve;
  return options;
});
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: flex-start;

  .info-container {
    display: flex;
    flex-direction: column;
    flex: 0 100%;
    max-width: calc(100% - 12rem);
    margin-left: 0.75rem;

    .author {
      display: inline-block;
      max-width: 75%;
      font-size: 1rem;
    }

    .edited,
    .time {
      color: #888;
      font-size: 0.75rem;
    }

    hr.v-divider--vertical {
      margin: 0.25rem 0.125rem 0.125rem 0.625rem;
    }

    ::v-deep .editor-link {
      display: inline-flex;
      align-self: flex-end;
    }
  }

  .actions {
    margin-left: auto;
  }
}
</style>
