<template>
  <VAppBar
    :color="toolbarColor"
    border="b surface"
    class="toolbar-wrapper"
    order="1"
  >
    <div v-if="activity && !element" class="activity-toolbar w-100 px-3">
      <ActivityActions />
      <VDivider class="rail-divider mx-2" vertical />
      <h1
        v-if="mdAndUp"
        class="activity-title align-center d-flex text-body-large text-truncate"
      >
        <span class="text-primary-lighten-3 font-weight-medium">
          {{ config.label }}
        </span>
        <span class="title-separator">/</span>
        <VIcon
          v-if="activity?.isLinkedCopy"
          v-tooltip:bottom="'Linked from another repository'"
          class="link-icon mr-1"
          color="lime-lighten-2"
          size="small"
          icon="mdi-link-box"
        />
        <ActivityName
          :activity="activity"
          :class="[
            'activity-name font-weight-medium',
            activity?.isLinkedCopy ? 'text-lime-lighten-2' : 'text-secondary-lighten-3',
          ]"
        />
        <template v-if="showPublishDiff">
          <span class="title-separator">·</span>
          <span class="text-grey-lighten-1 text-body-small">
            comparing with published
          </span>
          <VChip
            v-if="activity.publishedAt"
            class="ml-2"
            color="primary-lighten-4"
            text-color="grey-darken-4"
            size="x-small"
            label
          >
            {{ formatDate(activity.publishedAt, 'MM/dd/yy HH:mm') }}
          </VChip>
        </template>
      </h1>
      <div class="toolbar-trailing d-flex align-center ga-2">
        <template v-if="activity?.isLinkedCopy">
          <VBtn
            :disabled="!source"
            color="white"
            prepend-icon="mdi-open-in-new"
            size="small"
            variant="tonal"
            @click="source && viewSource(source)"
          >
            View source
          </VBtn>
          <VBtn
            color="white"
            prepend-icon="mdi-link-variant-off"
            size="small"
            variant="tonal"
            @click="activity && unlinkActivity(activity.id)"
          >
            Unlink
          </VBtn>
        </template>
        <ActiveUsersGroup
          v-if="!showPublishDiff && usersWithActivity.length"
          :users="usersWithActivity"
          :size="32"
        />
        <VAppBarNavIcon
          v-if="mdAndDown && !!editorStore.guidelines"
          color="lime"
          variant="tonal"
          icon="mdi-format-list-checks"
          size="small"
          @click="$emit('toggle-guidelines')"
        />
      </div>
    </div>
    <ElementToolbarContainer
      v-if="element"
      :element="element"
      class="element-container w-100"
    />
  </VAppBar>
</template>

<script lang="ts" setup>
import { ActiveUsersGroup } from '@tailor-cms/core-components';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { formatDate } from 'date-fns/format';

import { api } from '@/api';
import ActivityActions from './ActivityActions.vue';
import ActivityName from '@/components/common/ActivityName.vue';
import ElementToolbarContainer from './ElementToolbarContainer.vue';
import { useEditorStore } from '@/stores/editor';
import { useUserTracking } from '@/stores/user-tracking';
import { useDisplay } from 'vuetify';

interface Props {
  element?: ContentElement | null;
}

interface SourceInfo {
  id: number;
  repository: { id: number; name: string };
}

const props = withDefaults(defineProps<Props>(), {
  element: null,
});

defineEmits(['toggle-guidelines']);

const { $schemaService } = useNuxtApp() as any;

const showPublishDiff = computed(() => editorStore.showPublishDiff);

const notify = useNotification();
const editorStore = useEditorStore();
const userTrackingStore = useUserTracking();
const { mdAndUp, mdAndDown } = useDisplay();

const activity = computed(() => editorStore.selectedActivity);
const config = computed(
  () => activity.value && $schemaService.getLevel(activity.value?.type),
);

const toolbarColor = computed(() => {
  if (props.element) return 'white';
  return showPublishDiff.value ? '#1e282c' : 'transparent';
});

// Source info for linked activities
const source = ref<SourceInfo | null>(null);

const viewSource = (sourceInfo: SourceInfo) => {
  navigateTo({
    name: 'repository',
    params: { id: sourceInfo.repository.id },
    query: { activityId: sourceInfo.id },
  });
};

const unlinkActivity = async (activityId: number) => {
  try {
    await editorStore.unlinkActivity(activityId);
    notify('Activity unlinked', { immediate: true });
  } catch {
    notify('Failed to unlink activity', { color: 'error' });
  }
};

watch(activity, async (val) => {
  source.value = null;
  if (!val?.isLinkedCopy) return;
  source.value = await api.activity
    .getSource({
      params: { repositoryId: val.repositoryId, activityId: val.id },
    })
    .catch(() => null);
}, { immediate: true });

const usersWithActivity = computed(() => {
  return userTrackingStore.getActiveUsers(
    'activity',
    editorStore.selectedActivity?.id,
  );
});
</script>

<style lang="scss" scoped>
.toolbar-wrapper {
  > :deep(.v-toolbar__content) {
    height: auto !important;
    min-height: 4rem;
    padding: 0;
    overflow: visible;
  }

  :deep(.v-input) {
    position: relative;

    .v-input__details {
      position: absolute;
      padding: 0;

      .v-messages__message {
        margin-top: 0.5rem;
        border-radius: 4px;
        padding: 0.5rem 0.75rem;
        background-color: #424242;
        color: #fff;
      }
    }
  }

  &.bg-white {
    border-bottom: 1px solid #cfd8dc;
  }
}

.activity-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  min-height: 4rem;
  min-width: 0;
  gap: 0.25rem;
}

.activity-title {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  padding: 0 0.5rem;
  color: #fff;
  text-align: left;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-name {
  letter-spacing: 0.01em;
}

.title-separator {
  margin: 0 0.5rem;
  color: rgba(255, 255, 255, 0.32);
}

.toolbar-trailing {
  flex-shrink: 0;
  padding-right: 0.5rem;
}

.rail-divider {
  height: 1.5rem;
  border-color: rgba(255, 255, 255, 0.12);
  align-self: center;
}
</style>
