<template>
  <div class="activity-wrapper">
    <VHover>
      <template #default="{ isHovering, props: hoverProps }">
        <VSheet
          v-bind="hoverProps"
          :id="`activity_${activity.uid}`"
          :class="{
            selected: isSelected,
            highlighted: isHovering,
            disabled: isSoftDeleted,
          }"
          :style="{ 'border-left-color': config.color }"
          class="activity"
          data-testid="repository__structureActivity"
          @mousedown="currentRepositoryStore.selectActivity(activity.id)"
        >
          <template v-if="!isSoftDeleted">
            <VBtn
              v-if="hasSubtypes"
              :icon="`mdi-${icon}`"
              aria-label="Toggle expand"
              class="my-auto"
              color="primary-lighten-4"
              variant="text"
              @mousedown.stop="utils.toggleOutlineItemExpand(activity.uid)"
            >
            </VBtn>
            <div
              class="activity-name my-auto text-truncate text-primary-lighten-4"
            >
              {{ activity.data.name }}
            </div>
            <div v-if="isSelected || isHovering" class="actions my-auto">
              <OutlineItemToolbar
                :activity="activity"
                class="options-toolbar my-auto"
              />
              <VTooltip content-class="bg-primary-darken-4" location="bottom">
                <template #activator="{ props: tooltipProps }">
                  <VBtn
                    v-show="hasSubtypes"
                    v-bind="tooltipProps"
                    :icon="`mdi-chevron-${isExpanded ? 'up' : 'down'}`"
                    aria-label="Toggle expand alt"
                    class="my-auto mx-0"
                    color="primary-lighten-4"
                    variant="text"
                    @click="utils.toggleOutlineItemExpand(activity.uid)"
                  >
                  </VBtn>
                </template>
                <span>{{ isExpanded ? 'Collapse' : 'Expand' }}</span>
              </VTooltip>
              <OptionsMenu :activity="activity" class="options-menu" rounded />
            </div>
          </template>
          <template v-else>
            <div
              class="activity-name my-auto text-truncate text-primary-lighten-4"
            >
              <VChip class="mr-2">
                <span class="pr-1 font-weight-bold">Deleted:</span>
                Publish required
                <VTooltip location="bottom">
                  <template #activator="{ props: tooltipProps }">
                    <VIcon v-bind="tooltipProps" class="ml-2" color="secondary">
                      mdi-information-outline
                    </VIcon>
                  </template>
                  Will be removed upon publishing
                </VTooltip>
              </VChip>
              {{ activity.data.name }}
            </div>
          </template>
        </VSheet>
      </template>
    </VHover>
    <div v-if="!isSoftDeleted && isExpanded && hasSubtypes">
      <Draggable
        v-bind="{ handle: '.activity' }"
        :data-parent-id="activity.id"
        :list="children"
        :move="currentRepositoryStore.isValidDrop"
        group="activities"
        item-key="uid"
        @update="(data) => reorder(data, children)"
        @change="(e) => currentRepositoryStore.handleOutlineItemDrag(e, activity.id)"
      >
        <template #item="{ element, index: i }">
          <OutlineItem
            :activities="activities"
            :activity="element"
            :index="i + 1"
            class="sub-activity"
          />
        </template>
      </Draggable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';
import Draggable from 'vuedraggable';
import { size } from 'lodash-es';

import OptionsMenu from '@/components/common/ActivityOptions/ActivityMenu.vue';
import OutlineItem from '@/components/repository/Outline/OutlineItem.vue';
import OutlineItemToolbar from '@/components/common/ActivityOptions/ActivityToolbar.vue';
import type { StoreActivity } from '@/stores/activity';

const currentRepositoryStore = useCurrentRepository();

const { taxonomy } = storeToRefs(currentRepositoryStore);

interface Props {
  activity: StoreActivity;
  index: number;
  activities?: StoreActivity[];
}

const props = withDefaults(defineProps<Props>(), {
  activities: () => [],
});

const utils = useSelectedActivity(props.activity);
const reorder = useOutlineReorder();

const config = computed(() =>
  taxonomy.value.find((it: any) => it.type === props.activity.type),
);

const isSelected = computed(
  () => currentRepositoryStore.selectedActivity?.uid === props.activity.uid,
);

const isSoftDeleted = computed(() =>
  activityUtils.doesRequirePublishing(props.activity),
);

const isExpanded = computed(() =>
  utils.isOutlineItemExpanded(props.activity.uid),
);
const hasSubtypes = computed(() => !!size(config.value.subLevels));
const hasChildren = computed(() => children.value.length > 0 && hasSubtypes);
const children = computed(() => {
  return props.activities
    .filter((it) => {
      return (
        props.activity.id &&
        props.activity.id === it.parentId &&
        config.value.subLevels.includes(it.type)
      );
    })
    .sort((x, y) => x.position - y.position);
});

const icon = computed(() => {
  if (!hasSubtypes.value) return;
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
      color: rgb(var(--v-theme-primary-lighten-5)) !important;
      font-weight: 600 !important;
    }
  }

  &.disabled {
    background-color: rgb(var(--v-theme-primary-darken-4));
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
