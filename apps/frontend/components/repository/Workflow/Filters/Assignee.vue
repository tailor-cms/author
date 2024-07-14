<template>
  <div>
    <AssigneeAvatar
      v-for="assignee in options"
      :key="`assignee-${assignee.id}`"
      :class="{ active: selected.includes(assignee.id) }"
      :img-url="assignee.imgUrl"
      :label="assignee.label"
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
  selected?: number[];
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
