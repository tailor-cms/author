<template>
  <div>
    <AssigneeAvatar
      v-for="assignee in options"
      :key="`assignee-${assignee.id}`"
      v-bind="assignee"
      :class="{ active: selected.includes(assignee.id) }"
      class="avatar"
      show-tooltip
      @click="toggleAssignee(assignee.id)"
    />
    <AssigneeAvatar
      v-if="showUnassigned"
      :class="{ active: unassigned }"
      class="avatar"
      show-tooltip
      @click="toggleUnassigned"
    />
  </div>
</template>

<script lang="ts" setup>
import xor from 'lodash/xor';

import AssigneeAvatar from '../AssigneeAvatar.vue';

interface Props {
  selected?: string[];
  unassigned?: boolean;
  options?: Record<string, any>;
  showUnassigned?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: () => [],
  unassigned: false,
  options: () => ({}),
  showUnassigned: false,
});

const emit = defineEmits(['change:assignee', 'change:unassigned']);

const toggleAssignee = (id: string) =>
  emit('change:assignee', xor(props.selected, [id]));
const toggleUnassigned = () => emit('change:unassigned', !props.unassigned);
</script>

<style lang="scss" scoped>
:deep(.v-avatar) {
  border: 2px solid rgb(var(--v-theme-primary-lighten-4));

  &:not(:first-of-type) {
    margin-left: -0.5rem;
  }

  &.active {
    box-shadow: rgb(var(--v-theme-secondary)) 0 0 0 2px;
  }

  &:hover {
    z-index: 1;
    transform: scale(1.1);
    cursor: pointer;
  }
}
</style>
