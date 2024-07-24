<template>
  <div>
    <UserAvatar
      v-for="option in baseOptions"
      :key="`assignee-${option?.id}`"
      :aria-label="option?.label ?? 'Unassigned'"
      :class="{ active: isSelected(option?.id) }"
      :img-url="option?.imgUrl"
      :label="option?.label ?? 'Unassigned'"
      color="primary-lighten-4"
      tag="button"
      @click="toggleAssignee(option?.id)"
    />
    <VMenu v-if="moreOptions.length" :close-on-content-click="false">
      <template #activator="{ props: menuProps }">
        <VAvatar
          v-bind="menuProps"
          :class="{ active: moreOptions.some((it) => isSelected(it?.id)) }"
          color="primary-lighten-4"
          size="36"
        >
          +{{ moreOptions.length }}
        </VAvatar>
      </template>
      <VList color="primary-darken-3">
        <VListItem
          v-for="option in moreOptions"
          :key="`assignee-${option?.id}`"
          :active="isSelected(option?.id)"
          @click="toggleAssignee(option?.id)"
        >
          <template #prepend>
            <VListItemAction start>
              <VCheckboxBtn :model-value="isSelected(option?.id)" />
            </VListItemAction>
            <UserAvatar
              :img-url="option?.imgUrl"
              class="menu-avatar"
              color="primary-lighten-4"
              size="small"
            />
          </template>
          <VListItemTitle>{{ option?.label ?? 'Unassigned' }}</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </div>
</template>

<script lang="ts" setup>
import type { User } from '@tailor-cms/interfaces/user';
import { UserAvatar } from '@tailor-cms/core-components-next';
import xor from 'lodash/xor';

const NO_BASE_OPTIONS = 3;

const props = defineProps<{
  modelValue: Array<number | null>;
  options: Array<User | null>;
}>();
const emit = defineEmits(['update:modelValue']);

const toggleAssignee = (id?: number) =>
  emit('update:modelValue', xor(props.modelValue, [id ?? null]));

const baseOptions = computed(() => props.options.slice(0, NO_BASE_OPTIONS));
const moreOptions = computed(() => props.options.slice(NO_BASE_OPTIONS));

const isSelected = (id?: number) => props.modelValue.includes(id ?? null);
</script>

<style lang="scss" scoped>
:deep(.v-avatar):not(.menu-avatar) {
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
