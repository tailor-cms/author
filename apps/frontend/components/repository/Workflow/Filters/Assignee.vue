<template>
  <div>
    <VTooltip
      v-for="{ id, imgUrl, label } in options"
      :key="`assignee-${id}`"
      location="bottom"
      open-delay="500"
    >
      <template #activator="{ props: tooltipProps }">
        <UserAvatar
          v-bind="{ ...tooltipProps, label, imgUrl }"
          :class="{ active: modelValue.includes(id) }"
          color="primary-lighten-4"
          @click="toggleAssignee(id)"
        />
      </template>
      <span>{{ label }}</span>
    </VTooltip>
  </div>
</template>

<script lang="ts" setup>
import { UserAvatar } from '@tailor-cms/core-components-next';
import xor from 'lodash/xor';

const props = defineProps<{
  modelValue: number[];
  options: Record<string, any>;
}>();
const emit = defineEmits(['update:modelValue']);

const toggleAssignee = (id: number) =>
  emit('update:modelValue', xor(props.modelValue, [id]));
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
