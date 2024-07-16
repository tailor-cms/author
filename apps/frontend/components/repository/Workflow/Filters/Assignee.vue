<template>
  <div>
    <UserAvatar
      v-for="{ id, imgUrl, label } in baseOptions"
      :key="`assignee-${id}`"
      :class="{ active: modelValue.includes(id) }"
      v-bind="{ imgUrl, label }"
      :label="label"
      color="primary-lighten-4"
      @click="toggleAssignee(id)"
    />
    <VMenu v-if="moreOptions.length" :close-on-content-click="false">
      <template #activator="{ props: menuProps }">
        <VAvatar
          v-bind="menuProps"
          :class="{
            active: moreOptions.some((it) => modelValue.includes(it.id)),
          }"
          color="primary-lighten-4"
          size="36"
        >
          +{{ moreOptions.length }}
        </VAvatar>
      </template>
      <VList>
        <VListItem
          v-for="{ id, label, imgUrl } in moreOptions"
          :key="`assignee-${id}`"
          :active="modelValue.includes(id)"
          @click="toggleAssignee(id)"
        >
          <template #prepend>
            <VListItemAction start>
              <VCheckboxBtn :model-value="modelValue.includes(id)" />
            </VListItemAction>
            <UserAvatar
              v-bind="{ imgUrl, label }"
              class="menu-avatar"
              color="primary-lighten-4"
              size="small"
            />
          </template>
          <VListItemTitle>{{ label ?? 'Unassigned' }}</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </div>
</template>

<script lang="ts" setup>
import { UserAvatar } from '@tailor-cms/core-components-next';
import xor from 'lodash/xor';

const NO_BASE_OPTIONS = 3;

const props = defineProps<{
  modelValue: number[];
  options: Record<string, any>;
}>();
const emit = defineEmits(['update:modelValue']);

const toggleAssignee = (id: number) =>
  emit('update:modelValue', xor(props.modelValue, [id]));

const baseOptions = computed(() => props.options.slice(0, NO_BASE_OPTIONS));
const moreOptions = computed(() => props.options.slice(NO_BASE_OPTIONS));
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
