<template>
  <div class="navigation-container">
    <div class="navigation-header px-2 py-3 bg-primary-darken-3 elevation-2">
      <VTextField
        v-model="searchInput"
        class="mt-1 mb-3 mx-4"
        clear-icon="mdi-close"
        label="Search..."
        prepend-inner-icon="mdi-magnify"
        variant="plain"
        clearable
        hide-details
      />
    </div>
    <VTreeview
      :items="activityTreeData"
      :search="searchInput"
      class="pt-4"
      item-value="id"
      open-all
      @update:selected="navigateToActivity"
    >
      <template #prepend="{ item, open }">
        <VIcon v-if="!item?.isEditable" color="primary-lighten-2" class="mr-2">
          {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
        </VIcon>
      </template>
      <template #append="{ item }">
        <VIcon
          v-if="item?.isEditable"
          class="ml-2 mr-3 open-icon"
          color="secondary-lighten-4"
        >
          mdi-page-next-outline
        </VIcon>
      </template>
    </VTreeview>
  </div>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';
import { VTreeview } from 'vuetify/labs/VTreeview';

import type { Activity } from '@/api/interfaces/activity';
import type { Repository } from '@/api/interfaces/repository';

const { toTreeFormat } = activityUtils;
const { $schemaService } = useNuxtApp() as any;

const props = defineProps<{
  repository: Repository;
  activities: Activity[];
  selected: Activity;
}>();

const searchInput = ref('');

const attachActivityAttrs = (activity: Activity) => ({
  id: activity.id,
  title: activity.data.name,
  isEditable: $schemaService.isEditable(activity.type),
});

const activityTreeData = computed(() =>
  toTreeFormat(props.activities, { processNodeFn: attachActivityAttrs }),
);

const navigateToActivity = ([activityId]: number[]) => {
  if (activityId === props.selected.id) return;
  const activity = props.activities.find((it) => it.id === activityId);
  if (!activity || !isActivityEditable(activity)) return;
  navigateTo({
    name: 'editor',
    params: { id: props.repository.id, activityId },
  });
};

const isActivityEditable = (activity: Activity) => {
  return $schemaService.isEditable(activity.type);
};

// TODO: Implement once VTreeView is officially released (lab version used here)
// onMounted(() => {
// nextTick(() => {
//   const activityTreeEl = $refs.activityTree.$el;
//   const selectedNode = activityTreeEl.querySelector('.tree-node.selected');
//   selectedNode.scrollIntoView({ behavior: 'smooth' });
//   });
// });
// Implement alert if there are no search results
</script>

<style lang="scss" scoped>
.navigation-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.navigation-header {
  padding: 0.75rem 0 0;
}

.v-treeview {
  overflow-y: auto;

  ::v-deep {
    .v-treeview-node__toggle {
      outline: none;
    }

    .v-treeview-node__root::before {
      content: none;
    }

    .v-treeview-node__content {
      margin-left: 0;
    }

    .v-treeview-node__level {
      width: 0.75rem;
    }
  }
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

::v-deep {
  .v-list-item-action {
    display: none !important;
  }
}

::v-deep .v-list-item {
  .v-list-item__append {
    visibility: hidden;
  }

  &:hover {
    .v-list-item-title {
      font-weight: 600 !important;
      color: #f8bbd0;
    }

    .v-list-item__append {
      visibility: visible;
    }
  }
}
</style>
