<template>
  <div>
    <AssigneeAvatar
      v-for="assignee in options"
      :key="`assignee-${assignee.id}`"
      :class="{ active: assigneeIds.includes(assignee.id) }"
      :img-url="assignee.imgUrl"
      :label="assignee.label"
      show-tooltip
      @click="toggleAssignee(assignee.id)"
    />
    <AssigneeAvatar
      v-if="showUnassigned"
      :class="{ active: unassigned }"
      show-tooltip
      @click="toggleUnassigned"
    />
  </div>
</template>

<script lang="ts" setup>
import xor from 'lodash/xor';

import AssigneeAvatar from '../AssigneeAvatar.vue';

interface Props {
  assigneeIds?: number[];
  unassigned?: boolean;
  options?: Record<string, any>;
  showUnassigned?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  assigneeIds: () => [],
  unassigned: false,
  options: () => ({}),
  showUnassigned: false,
});

const emit = defineEmits(['update:assigneeIds', 'update:unassigned']);

const toggleAssignee = (id: number) =>
  emit('update:assigneeIds', xor(props.assigneeIds, [id]));
const toggleUnassigned = () => emit('update:unassigned', !props.unassigned);
</script>

<style lang="scss" scoped>
:deep(.v-avatar) {
  transition: all 0.3s ease;
  outline: 0 solid rgb(var(--v-theme-secondary));

  &:not(:first-of-type) {
    margin-left: -0.5rem;
  }

  &.active {
    outline-width: 2px;
  }

  &:hover {
    z-index: 1;
    transform: scale(1.1);
    cursor: pointer;
  }
}
</style>
