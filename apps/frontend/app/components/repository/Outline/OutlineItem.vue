<template>
  <div class="activity-wrapper">
    <VHover>
      <template #default="{ isHovering, props: hoverProps }">
        <VListItem
          :id="`activity_${activity.uid}`"
          ref="rowEl"
          v-bind="hoverProps"
          :active="isSelected"
          :class="{ selected: isSelected, disabled: isSoftDeleted }"
          :ripple="false"
          :style="{ '--row-accent': config?.color }"
          class="activity bg-surface"
          data-testid="repository__structureActivity"
          elevation="1"
          link
          @mousedown="selectActivity(activity.id)"
        >
          <template v-if="!isSoftDeleted && hasSubtypes" #prepend>
            <VBtn
              :icon="`mdi-${icon}`"
              aria-label="Toggle expand"
              class="my-auto"
              density="comfortable"
              variant="text"
              @mousedown.stop="utils.toggleOutlineItemExpand(activity.uid)"
            >
            </VBtn>
          </template>
          <div
            v-if="!isSoftDeleted"
            class="activity-name text-truncate"
          >
            <VIcon
              v-if="activity.isLinkedCopy"
              class="linked-copy-icon mr-2"
              color="tertiary"
              icon="mdi-link-box"
            />
            <ActivityName :activity="activity" />
          </div>
          <div v-else class="activity-name my-auto text-truncate">
            <ActivityName :activity="activity" />
          </div>
          <template #append>
            <div
              v-if="!isSoftDeleted && (isSelected || isHovering)"
              class="actions my-auto"
            >
              <OutlineItemToolbar
                :activity="activity"
                class="options-toolbar my-auto"
              />
              <VBtn
                v-if="smAndUp"
                v-show="hasSubtypes"
                v-tooltip:bottom="isExpanded ? 'Collapse' : 'Expand'"
                :icon="`mdi-chevron-${isExpanded ? 'up' : 'down'}`"
                aria-label="Toggle expand alt"
                class="my-auto text-medium-emphasis mx-0"
                variant="text"
                @click="utils.toggleOutlineItemExpand(activity.uid)"
              />
              <OptionsMenu
                :activity="activity"
                class="options-menu text-medium-emphasis"
                rounded
              />
            </div>
            <VChip v-else-if="isSoftDeleted" class="mr-3" size="small">
              <span class="pr-1 font-weight-bold">Deleted:</span>
              Publish required
              <VIcon
                v-tooltip:bottom="'Will be removed upon publishing'"
                class="ml-2"
                color="error"
                icon="mdi-information-outline"
              />
            </VChip>
          </template>
        </VListItem>
      </template>
    </VHover>
    <VExpandTransition>
      <div
        v-if="!isSoftDeleted && isExpanded && hasSubtypes"
        :class="{ 'mt-2': hasChildren }"
      >
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
    </VExpandTransition>
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
.activity {
  height: 3.25rem;
  min-height: 3.25rem;
  padding: 0 0 0 0.625rem;
  cursor: pointer;
  border-radius: 0.25rem;
  border-left: 8px solid var(--row-accent);
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

  &-name {
    display: flex;
    align-items: center;
    padding: 0.125rem 0.75rem 0 0.25rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 2.5rem;
  }

  &.selected .activity-name {
    font-weight: 600 !important;
  }

  &.disabled {
    background-color: rgba(var(--v-theme-error), 0.15);
    border-left-color: rgb(var(--v-theme-error));
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
