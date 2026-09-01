<template>
  <div class="navigation-container">
    <div class="controls px-3 pt-2">
      <div class="d-flex align-center ga-2">
        <VTextField
          v-model="searchInput"
          class="flex-grow-1"
          bg-color="surface-container"
          clear-icon="mdi-close"
          density="compact"
          placeholder="Search..."
          prepend-inner-icon="mdi-magnify"
          rounded="lg"
          variant="solo"
          flat
          clearable
          hide-details
        />
        <VBtn
          v-if="treeRef?.hasItems"
          v-tooltip:bottom="{ text: toggleLabel, openDelay: 500 }"
          :aria-label="toggleLabel"
          :icon="treeRef?.isFullyExpanded
            ? 'mdi-unfold-less-horizontal'
            : 'mdi-unfold-more-horizontal'"
          size="x-small"
          variant="tonal"
          @click="treeRef?.toggleExpand()"
        />
      </div>
    </div>
    <div class="tree-scroll">
      <TailorTreeview
        ref="treeRef"
        :active-item-id="selected?.id"
        :items="activityTreeData"
        :search="searchInput"
        @edit="navigateToActivity"
        @clear:search="searchInput = ''"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import { activity as activityUtils } from '@tailor-cms/utils';
import type { Repository } from '@tailor-cms/interfaces/repository';
import { sortBy } from 'lodash-es';
import TailorTreeview from './TailorTreeview/index.vue';

const { $schemaService } = useNuxtApp() as any;

const { getActivityName } = useActivityName();

const props = defineProps<{
  repository: Repository;
  activities: Activity[];
  selected: Activity;
}>();

const searchInput = ref('');
const treeRef = useTemplateRef<InstanceType<typeof TailorTreeview>>('treeRef');

const toggleLabel = computed(() =>
  treeRef.value?.isFullyExpanded ? 'Collapse all' : 'Expand all',
);

const attachActivityAttrs = (activity: Activity) => ({
  id: activity.id,
  uid: activity.uid,
  title: getActivityName(activity),
  isEditable: !!$schemaService.isEditable(activity.type),
  isGroup: !!$schemaService.getLevel(activity.type)?.subLevels?.length,
});

const activityTreeData = computed(() => {
  const withoutSoftDeleted = props.activities.filter((it) => !it.deletedAt);
  const sortedActivities = sortBy(withoutSoftDeleted, 'position');
  return activityUtils.toTreeFormat(sortedActivities, {
    processNodeFn: attachActivityAttrs,
  });
});

const navigateToActivity = (activityId: number) => {
  if (activityId === props.selected.id) return;
  const activity = props.activities.find((it) => it.id === activityId);
  if (!activity) return;
  navigateTo({
    name: 'editor',
    params: { id: props.repository.id, activityId },
  });
};
</script>

<style lang="scss" scoped>
.navigation-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.controls {
  flex: 0 0 auto;
}

.tree-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.tree-node {
  display: flex;
  align-items: center;
  min-height: 3rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    opacity: 0;
    background-color: currentColor;
    transition: 0.1s cubic-bezier(0.25, 0.8, 0.5, 1);
    pointer-events: none;
  }

  &.selected::before {
    opacity: 0.12;
  }

  &.selectable {
    justify-content: space-between;

    .open-icon {
      transition: opacity 0.15s ease 0.1s;
      opacity: 0;
    }

    &:not(.selected):hover {
      cursor: pointer;

      &::before {
        opacity: 0.04;
      }

      .open-icon {
        opacity: 1;
      }
    }
  }
}

:deep(.v-list-item) {
  &:hover {
    .v-list-item-title {
      color: rgb(var(--v-theme-primary));
    }

    .v-list-item__append {
      visibility: visible;
    }
  }
}
</style>
