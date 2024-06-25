<template>
  <div class="activity-wrapper">
    <VHover>
      <template #default="{ isHovering, props: hoverProps }">
        <VSheet
          v-bind="hoverProps"
          :id="`activity_${uid}`"
          :class="{ selected: isSelected, highlighted: isHovering }"
          :style="{ 'border-left-color': config.color }"
          class="activity"
          data-testid="repository__structureActivity"
          @mousedown="currentRepositoryStore.selectActivity(id)"
        >
          <VBtn
            v-if="hasSubtypes"
            :icon="`mdi-${icon}`"
            aria-label="Toggle expand"
            class="my-auto"
            color="primary-lighten-3"
            variant="text"
            @mousedown.stop="utils.toggleOutlineItemExpand(uid)"
          >
          </VBtn>
          <div
            class="activity-name h5 my-auto text-truncate text-primary-lighten-4"
          >
            {{ data.name }}
          </div>
          <div v-if="isSelected || isHovering" class="actions my-auto">
            <OutlineItemToolbar
              :activity="activity"
              class="options-toolbar my-auto"
            />
            <VTooltip location="bottom">
              <template #activator="{ props: tooltipProps }">
                <VBtn
                  v-show="hasSubtypes"
                  v-bind="tooltipProps"
                  :icon="`mdi-chevron-${isExpanded ? 'up' : 'down'}`"
                  aria-label="Toggle expand alt"
                  class="my-auto mx-0"
                  color="primary-lighten-4"
                  variant="text"
                  @click="utils.toggleOutlineItemExpand(uid)"
                >
                </VBtn>
              </template>
              <span>{{ isExpanded ? 'Collapse' : 'Expand' }}</span>
            </VTooltip>
            <OptionsMenu :activity="activity" class="options-menu" />
          </div>
        </VSheet>
      </template>
    </VHover>
    <div v-if="isExpanded && hasChildren">
      <Draggable
        :list="children"
        v-bind="{ handle: '.activity' }"
        item-key="uid"
        @update="(data) => reorder(data, children)"
      >
        <template #item="{ element, index: i }">
          <OutlineItem
            v-bind="element"
            :activities="activities"
            :index="i + 1"
            class="sub-activity"
          />
        </template>
      </Draggable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Draggable from 'vuedraggable';
import size from 'lodash/size';

import OptionsMenu from '@/components/common/ActivityOptions/ActivityMenu.vue';
import OutlineItem from '@/components/repository/Outline/OutlineItem.vue';
import OutlineItemToolbar from '@/components/common/ActivityOptions/ActivityToolbar.vue';
import type { StoreActivity } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const currentRepositoryStore = useCurrentRepository();
const { taxonomy } = storeToRefs(currentRepositoryStore);

interface Props extends StoreActivity {
  activities?: StoreActivity[];
}

const activity = withDefaults(defineProps<Props>(), {
  in: null,
  parentId: null,
  activities: () => [],
});

const utils = useSelectedActivity(activity);
const reorder = useOutlineReorder();

const config = computed(() =>
  taxonomy.value.find((it: any) => it.type === activity.type),
);

const isSelected = computed(
  () => currentRepositoryStore.selectedActivity?.uid === activity.uid,
);

const isExpanded = computed(() => utils.isOutlineItemExpanded(activity.uid));
const hasSubtypes = computed(() => !!size(config.value.subLevels));
const hasChildren = computed(() => children.value.length > 0 && hasSubtypes);
const children = computed(() => {
  return activity.activities
    .filter((it) => {
      return (
        activity.id &&
        activity.id === it.parentId &&
        config.value.subLevels.includes(it.type)
      );
    })
    .sort((x, y) => x.position - y.position);
});

const icon = computed(() => {
  if (!hasSubtypes) return;
  let icon = isExpanded.value ? 'folder-open' : 'folder';
  if (!hasChildren.value) icon += '-outline';
  return icon;
});
</script>

<style lang="scss" scoped>
$background-color: rgb(var(--v-theme-primary-darken-2));

.activity {
  display: flex;
  height: 3.25rem;
  margin: 0.625rem 0;
  padding: 0 0 0 0.375rem;
  background-color: $background-color;
  cursor: pointer;
  border-radius: 0.25rem;
  border-left-width: 8px;
  border-left-style: solid;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

  &-name {
    padding: 0.125rem 0.75rem 0 0.375rem;
    font-size: 1rem !important;
    font-weight: 400 !important;
    line-height: 2.5rem;
  }

  &.selected,
  &.highlighted {
    background-color: rgb(var(--v-theme-primary-darken-1));

    .activity-name {
      color: rgb(var(--v-theme-primary-lighten-4)) !important;
      font-weight: 600 !important;
    }
  }

  &.selected {
    border-left-width: 2.25rem;
  }

  .actions {
    display: flex;
    height: 100%;
    margin: 0 0 0 auto;
    padding: 0;

    .v-btn {
      margin: 0.375rem 0.5rem;
    }

    .options-menu :deep(.v-btn) {
      height: 100%;
    }

    .options-toolbar {
      padding-top: 0.125rem;
    }
  }
}

.sub-activity {
  margin-left: 1.25rem;
}
</style>
