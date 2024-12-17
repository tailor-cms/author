<template>
  <div class="toolbar-wrapper elevation-3">
    <div
      :style="{
        left: lgAndUp ? '480px' : '380px',
        ...!!repositoryStore.selectedActivityGuidelines && { right: '380px' },
      }"
    >
      <div
        v-if="activity && !element"
        :class="[showPublishDiff ? 'bg-publish-diff' : 'bg-primary-darken-4']"
        class="activity-toolbar px-3 align-center w-100"
      >
        <ActivityActions class="ml-1" />
        <h1 class="py-2 px-6 text-h5 text-truncate">
          <span>{{ config.label }}</span>
          <span class="px-2 text-grey">|</span>
          <span class="text-secondary-lighten-3">
            {{ activity.data.name }}
          </span>
          <template v-if="showPublishDiff">
            <span class="px-2 text-grey">|</span>
            <span class="text-white">comparing with published</span>
            <span class="px-2 text-grey">@</span>
            <VChip
              v-if="activity.publishedAt"
              class="readonly"
              color="primary-lighten-4"
              text-color="grey-darken-4"
              label
              small
            >
              {{ formatDate(activity.publishedAt, 'MM/dd/yy HH:mm') }}
            </VChip>
          </template>
        </h1>
        <ActiveUsers
          v-if="!showPublishDiff"
          :users="usersWithActivity"
          class="mx-3"
        />
      </div>
      <ElementToolbarContainer
        v-if="element"
        :element="element"
        class="element-container"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ActiveUsers } from '@tailor-cms/core-components';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { formatDate } from 'date-fns/format';
import { useDisplay } from 'vuetify';

import ActivityActions from './ActivityActions.vue';
import ElementToolbarContainer from './ElementToolbarContainer.vue';
import { useEditorStore } from '@/stores/editor';
import { useUserTracking } from '@/stores/user-tracking';

interface Props {
  element: ContentElement | null;
}

withDefaults(defineProps<Props>(), {
  element: null,
});

const { $schemaService } = useNuxtApp() as any;
const { lgAndUp } = useDisplay();
const repositoryStore = useCurrentRepository();

const showPublishDiff = computed(() => editorStore.showPublishDiff);

const editorStore = useEditorStore();
const userTrackingStore = useUserTracking();

const activity = computed(() => editorStore.selectedActivity);
const config = computed(
  () => activity.value && $schemaService.getLevel(activity.value?.type),
);

const usersWithActivity = computed(() => {
  return userTrackingStore.getActiveUsers(
    'activity',
    editorStore.selectedActivity?.id,
  );
});
</script>

<style lang="scss" scoped>
.toolbar-wrapper {
  position: relative;
  width: 100%;

  > div {
    display: flex;
    position: fixed;
    top: 0;
    right: 0;
    left: 30rem;
    margin-top: 5rem;
    min-height: 5.5rem;
    z-index: 99;
  }

  :deep(.v-input) {
    position: relative;

    .v-input__details {
      position: absolute;
      padding: 0 !important;

      .v-messages {
        margin-top: 0.5rem;
        border-radius: 4px;
        padding: 0.5rem 0.75rem;
        background-color: #424242;
        color: #fff !important;
      }
    }
  }
}

.activity-toolbar {
  display: flex;
  height: 5.625rem;
  z-index: 999;

  h1 {
    flex: 1;
    margin: 0;
    color: #fff;
    font-size: 1.375rem;
    text-align: left;
  }
}

.bg-publish-diff {
  background-color: #1e282c;
}
</style>
