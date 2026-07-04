<template>
  <VSheet
    ref="rootEl"
    :class="{ selected: isSelected }"
    class="list-item text-left"
    color="surface-raised"
    elevation="1"
    rounded="lg"
    @click="emit('select', activity.id)"
  >
    <span
      class="list-item__accent"
      :style="{ backgroundColor: typeConfig?.color }"
    />
    <div class="list-item__main">
      <div class="list-item__title text-body-medium text-truncate">
        <VChip v-if="hasMultipleTypes" class="mr-2" size="x-small">
          {{ typeConfig?.label }}
        </VChip>
        <VChip color="tertiary" class="mr-2" size="x-small">
          {{ activity.shortId }}
        </VChip>
        {{ activity.data.name }}
      </div>
    </div>
    <div class="list-item__meta d-flex align-center ga-3">
      <DueDate
        v-if="activity.currentStatus.dueDate"
        :date="activity.currentStatus.dueDate"
        class="text-body-small d-none d-sm-flex"
      />
      <StatusMenu :activity="activity" />
      <PriorityMenu :activity="activity">
        <template #activator="{ props: menuProps }">
          <VBtn
            v-tooltip:bottom="priority?.label"
            v-bind="menuProps"
            :color="priority?.color"
            class="list-item__editable"
            size="26"
            variant="tonal"
            icon
            @click.stop
          >
            <VIcon :icon="priority?.icon" size="16" />
          </VBtn>
        </template>
      </PriorityMenu>
      <AssigneeMenu :activity="activity">
        <template #activator="{ props: menuProps }">
          <UserAvatar
            v-bind="menuProps"
            :img-url="assignee?.imgUrl"
            :label="assignee?.label ?? 'Unassigned'"
            class="list-item__editable"
            size="26"
            @click.stop
          />
        </template>
      </AssigneeMenu>
      <PublishingBadge :activity="activity" />
    </div>
  </VSheet>
</template>

<script lang="ts" setup>
import { UserAvatar } from '@tailor-cms/core-components';
import { workflow as workflowConfig } from '@tailor-cms/config';

import AssigneeMenu from '../AssigneeMenu.vue';
import DueDate from '../DueDate.vue';
import PriorityMenu from '../PriorityMenu.vue';
import StatusMenu from '../StatusMenu.vue';
import PublishingBadge from '../../Sidebar/PublishingBadge.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activity: StoreActivity;
}>();

const emit = defineEmits<{ select: [id: number] }>();

const { selectedActivity, activityTypes, hasMultipleTypes } = storeToRefs(
  useCurrentRepository(),
);

const currentStatus = computed(() => props.activity.currentStatus);
const assignee = computed(() => currentStatus.value.assignee);
const priority = computed(() =>
  workflowConfig.getPriority(currentStatus.value.priority),
);
const typeConfig = computed(() =>
  activityTypes.value.find((it: any) => it.type === props.activity.type),
);
const isSelected = computed(
  () => selectedActivity.value?.id === props.activity.id,
);

const rootEl = ref<{ $el: HTMLElement } | null>(null);
useScrollWhenSelected(() => rootEl.value?.$el, isSelected);
</script>

<style lang="scss" scoped>
.list-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.625rem 1rem 0.625rem 1.25rem;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover,
  &.selected {
    background: rgb(var(--v-theme-surface-container-high));
  }
}

.list-item__accent {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 8px;
}

.list-item__main {
  flex: 1 1 auto;
  min-width: 0;
}

.list-item__title {
  line-height: 1.3;
}

.list-item__meta {
  flex: 0 0 auto;
}

.list-item__editable {
  cursor: pointer;
}
</style>
