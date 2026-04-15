<template>
  <VAppBar
    :color="toolbarColor"
    class="toolbar-wrapper"
    elevation="3"
    order="1"
  >
    <div v-if="activity && !element" class="activity-toolbar w-100 px-3 py-2">
      <ActivityActions />
      <h1 v-if="mdAndUp" class="py-2 px-6 text-h5 text-truncate">
        <span>{{ config.label }}</span>
        <span class="px-3 text-grey">|</span>
        <span v-if="activity?.isLinkedCopy" class="linked-label text-white">
          <VIcon class="mr-1" color="lime-lighten-2" size="small">
            mdi-link-variant
          </VIcon>
          Linked -
        </span>
        <ActivityName
          :activity="activity"
          :class="[
            activity?.isLinkedCopy ? 'text-white' : 'text-secondary-lighten-3',
          ]"
        />
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
      <div v-if="activity?.isLinkedCopy" class="d-flex align-center mr-6">
        <VBtn
          :disabled="!source"
          class="mr-3"
          color="white"
          prepend-icon="mdi-open-in-new"
          size="small"
          variant="outlined"
          @click="source && viewSource(source)"
        >
          View source
        </VBtn>
        <VBtn
          color="white"
          prepend-icon="mdi-link-variant-off"
          size="small"
          variant="outlined"
          @click="activity && unlinkActivity(activity.id)"
        >
          Unlink
        </VBtn>
        <ActiveUsers
          v-if="!showPublishDiff && usersWithActivity.length"
          :users="usersWithActivity"
          class="mx-3"
        />
        <VAppBarNavIcon
          v-if="mdAndDown && !!editorStore.guidelines"
          color="lime"
          variant="tonal"
          icon="mdi-format-list-checks"
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
import { ActiveUsers } from '@tailor-cms/core-components';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { formatDate } from 'date-fns/format';

import { activity as activityApi } from '@/api';
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
  return showPublishDiff.value ? '#1e282c' : 'primary-darken-4';
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
  source.value = await activityApi
    .getSource(val.repositoryId, val.id)
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
  :deep(.v-toolbar__content) {
    height: unset !important;
  }

  :deep(.v-input) {
    position: relative;

    .v-input__details {
      position: absolute;
      padding: 0 !important;

      .v-messages__message {
        margin-top: 0.5rem;
        border-radius: 4px;
        padding: 0.5rem 0.75rem;
        background-color: #424242;
        color: #fff !important;
      }
    }
  }

  &.bg-white {
    border-bottom: 4px solid #cfd8dc;
  }
}

.activity-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  min-height: 5.625rem;

  h1 {
    flex: 1;
    color: #fff;
    text-align: left;
  }
}
</style>
