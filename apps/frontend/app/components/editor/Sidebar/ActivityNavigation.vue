<template>
  <div ref="navigationContainer" class="navigation-container">
    <div class="d-flex align-center px-2">
      <VTextField
        v-model="searchInput"
        clear-icon="mdi-close"
        placeholder="Search..."
        bg-color="transparent"
        density="comfortable"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        flat
        clearable
        hide-details
      />
      <VBtn
        v-if="treeRef?.hasItems"
        rounded="lg"
        size="small"
        variant="text"
        width="90"
        :text="treeRef?.isFullyExpanded ? 'Collapse all' : 'Expand all'"
        @click="treeRef?.toggleExpand()"
      />
    </div>
    <TailorTreeview
      ref="treeRef"
      :active-item-id="selected?.id"
      :items="activityTreeData"
      :search="searchInput"
      @edit="navigateToActivity"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import { activity as activityUtils } from '@tailor-cms/utils';
import type { Repository } from '@tailor-cms/interfaces/repository';
import { sortBy } from 'lodash-es';
import TailorTreeview from './TailorTreeview/index.vue';

const { $schemaService, $pluginRegistry } = useNuxtApp() as any;

const props = defineProps<{
  repository: Repository;
  activities: Activity[];
  selected: Activity;
}>();

const searchInput = ref('');
const treeRef = useTemplateRef<InstanceType<typeof TailorTreeview>>('treeRef');
const navigationContainer = useTemplateRef<HTMLElement>('navigationContainer');

// Get processed name via plugin hooks
const getActivityName = (activity: Activity) => {
  const data = activity.data;
  const rawValue = data?.name ?? '';
  return $pluginRegistry.filter('data:value', rawValue, { data, key: 'name' });
};

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

const scrollSelectedItemIntoView = async () => {
  await nextTick();
  const selectedNode =
    navigationContainer.value?.querySelector<HTMLElement>('.list-item-active');
  selectedNode?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

onMounted(scrollSelectedItemIntoView);
watch(() => props.selected.id, scrollSelectedItemIntoView);

// Implement alert if there are no search results
</script>

<style lang="scss" scoped>
.navigation-container {
  display: flex;
  flex-direction: column;
  height: 100%;
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
