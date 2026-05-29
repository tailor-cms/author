<template>
  <div class="activity-wrapper">
    <VHover>
      <template #default="{ isHovering, props: hoverProps }">
        <VSheet
          :id="`activity_${activity.uid}`"
          ref="rowEl"
          v-bind="hoverProps"
          :class="{
            selected: isSelected,
            highlighted: isHovering,
            disabled: isSoftDeleted,
          }"
          :style="{ '--row-accent': config?.color }"
          class="activity"
          data-testid="repository__structureActivity"
          @mousedown="selectActivity(activity.id)"
        >
          <template v-if="!isSoftDeleted">
            <VBtn
              v-if="hasSubtypes"
              :icon="`mdi-${icon}`"
              aria-label="Toggle expand"
              class="my-auto"
              density="comfortable"
              color="primary-lighten-4"
              variant="text"
              @mousedown.stop="utils.toggleOutlineItemExpand(activity.uid)"
            >
            </VBtn>
            <div
              class="activity-name text-truncate text-primary-lighten-4"
            >
              <VIcon
                v-if="activity.isLinkedCopy"
                class="linked-copy-icon mr-2"
                color="lime-lighten-1"
                icon="mdi-link-box"
              />
              <ActivityName :activity="activity" />
            </div>
            <div v-if="isSelected || isHovering" class="actions my-auto">
              <OutlineItemToolbar
                :activity="activity"
                class="options-toolbar my-auto"
              />
              <VTooltip
                v-if="smAndUp"
                content-class="bg-primary-darken-4"
                location="bottom"
              >
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
          <div v-else class="d-flex align-center w-100 justify-space-between">
            <div
              class="activity-name my-auto text-truncate text-primary-lighten-4"
            >
              <ActivityName :activity="activity" />
            </div>
            <VChip class="mr-3" color="white" size="small">
              <span class="pr-1 font-weight-bold">Deleted:</span>
              Publish required
              <VIcon
                v-tooltip:bottom="'Will be removed upon publishing'"
                class="ml-2"
                color="secondary"
                icon="mdi-information-outline"
              />
            </VChip>
          </div>
        </VSheet>
      </template>
    </VHover>
    <div v-if="!isSoftDeleted && isExpanded && hasSubtypes" class="mt-2">
      <Draggable
        v-bind="{ handle: '.activity' }"
        :data-parent-id="activity.id"
        :list="children"
        :move="currentRepositoryStore.isValidDrop"
        animation="150"
        class="d-flex flex-column ga-2"
        group="activities"
        item-key="uid"
        @update="(e: SortableEvent) => reorder(e, children)"
        @change="(e: ChangeEvent) => onOutlineItemDrop(e, activity.id)"
      >
        <template #item="{ element, index: i }">
          <OutlineItem
            :activities="activities"
            :activity="element"
            :index="i + 1"
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
import { useDisplay } from 'vuetify';

import type { ChangeEvent, SortableEvent } from '@/types/draggable';
import ActivityName from '@/components/common/ActivityName.vue';
import OptionsMenu from '@/components/common/ActivityOptions/ActivityMenu.vue';
import OutlineItem from '@/components/repository/Outline/OutlineItem.vue';
import OutlineItemToolbar from '@/components/common/ActivityOptions/ActivityToolbar.vue';
import type { StoreActivity } from '@/stores/activity';

const { smAndUp } = useDisplay();
const currentRepositoryStore = useCurrentRepository();

const { selectedActivity, taxonomy } = storeToRefs(currentRepositoryStore);
const { onOutlineItemDrop, selectActivity } = currentRepositoryStore;

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

const rowEl = ref<{ $el: HTMLElement } | null>(null);

const config = computed(() =>
  taxonomy.value?.find((it: any) => it.type === props.activity.type),
);

const isSelected = computed(
  () => selectedActivity.value?.uid === props.activity.uid,
);

const isSoftDeleted = computed(() =>
  activityUtils.doesRequirePublishing(props.activity),
);

const isOffscreen = (el: HTMLElement) => {
  const { top, bottom } = el.getBoundingClientRect();
  return top < 0 || bottom > window.innerHeight;
};

const scrollIntoView = async (behavior: ScrollBehavior) => {
  await nextTick();
  const el = rowEl.value?.$el;
  if (el && isOffscreen(el)) el.scrollIntoView({ behavior, block: 'center' });
};

onMounted(() => {
  if (isSelected.value) scrollIntoView('auto');
});

watch(isSelected, (selected) => {
  if (selected) scrollIntoView('smooth');
});

const isExpanded = computed(() =>
  utils.isOutlineItemExpanded(props.activity.uid),
);
const hasSubtypes = computed(() => !!size(config.value?.subLevels));
const hasChildren = computed(() => children.value.length > 0 && hasSubtypes);
const children = computed(() => {
  return props.activities
    .filter((it) => {
      return (
        props.activity.id &&
        props.activity.id === it.parentId &&
        config.value?.subLevels?.includes(it.type)
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
  padding: 0 0 0 0.625rem;
  background-color: $background-color;
  cursor: pointer;
  border-radius: 0.25rem;
  border-left: 8px solid var(--row-accent);
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

  &-name {
    display: flex;
    align-items: center;
    padding: 0.125rem 0.75rem 0 0.25rem;
  }

  &.selected,
  &.highlighted {
    background-color: rgb(var(--v-theme-primary-darken-1));

    .activity-name {
      color: rgb(var(--v-theme-primary-lighten-5)) !important;
    }
  }

  &.selected .activity-name {
    font-weight: 600 !important;
  }

  &.disabled {
    background-color: rgba(var(--v-theme-secondary-lighten-3), 0.2);
    border-left-color: rgb(var(--v-theme-secondary-lighten-3));

    &.selected,
    &.highlighted {
      background-color: rgba(var(--v-theme-secondary-lighten-3), 0.3);
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

    .options-menu :deep(.v-btn) {
      height: 100%;
    }

    .options-toolbar {
      padding-top: 0.125rem;
    }
  }
}

.activity-wrapper .activity-wrapper {
  margin-left: 1.25rem;
}
</style>
