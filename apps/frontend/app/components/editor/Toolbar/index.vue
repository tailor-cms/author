<template>
  <VAppBar
    :color="toolbarColor"
    class="toolbar-wrapper"
    elevation="3"
    order="1"
  >
    <VAppBarNavIcon v-if="smAndDown" @click="$emit('toggle-sidebar')" />
    <div v-if="activity && !element" class="activity-toolbar w-100 px-3 py-2">
      <ActivityActions />
      <h1 v-if="mdAndUp" class="py-2 px-6 text-h5 text-truncate">
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
      <div class="d-flex align-center">
        <ActiveUsers
          v-if="!showPublishDiff && usersWithActivity.length"
          :users="usersWithActivity"
          class="mx-2"
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

import ActivityActions from './ActivityActions.vue';
import ElementToolbarContainer from './ElementToolbarContainer.vue';
import { useEditorStore } from '@/stores/editor';
import { useUserTracking } from '@/stores/user-tracking';
import { useDisplay } from 'vuetify';

interface Props {
  element?: ContentElement | null;
}

const props = withDefaults(defineProps<Props>(), {
  element: null,
});
defineEmits(['toggle-sidebar', 'toggle-guidelines']);

const { $schemaService } = useNuxtApp() as any;

const showPublishDiff = computed(() => editorStore.showPublishDiff);

const editorStore = useEditorStore();
const userTrackingStore = useUserTracking();
const { mdAndUp, smAndDown, mdAndDown } = useDisplay();

const activity = computed(() => editorStore.selectedActivity);
const config = computed(
  () => activity.value && $schemaService.getLevel(activity.value?.type),
);

const toolbarColor = computed(() => {
  if (props.element) return 'white';
  return showPublishDiff.value ? '#1e282c' : 'primary-darken-4';
});

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

      .v-messages {
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
