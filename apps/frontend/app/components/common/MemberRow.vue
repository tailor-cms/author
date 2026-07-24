<template>
  <VListItem
    :subtitle="subtitle"
    :title="title"
    class="member-row bg-surface-raised py-3 px-4 mb-2"
    elevation="1"
    rounded="lg"
  >
    <template #prepend>
      <UserAvatar :img-url="imgUrl" size="34" />
    </template>
    <template #append>
      <VMenu location="bottom end">
        <template #activator="{ props: menuProps }">
          <VBtn
            v-bind="menuProps"
            :text="roleLabel"
            append-icon="mdi-chevron-down"
            class="member-role-btn mr-2"
            rounded="lg"
            size="small"
            variant="tonal"
          />
        </template>
        <VList density="compact" max-width="360" min-width="240" nav>
          <VListSubheader>Choose role</VListSubheader>
          <VListItem
            v-for="option in roles"
            :key="option.value"
            :active="role === option.value"
            :prepend-icon="optionIcon(option.value)"
            :subtitle="option.description"
            :title="option.title"
            class="role-option"
            lines="two"
            @click="emit('update:role', option.value)"
          />
        </VList>
      </VMenu>
      <VBtn
        v-tooltip:bottom="{ text: 'Remove user', openDelay: 500 }"
        aria-label="Remove user"
        color="error"
        density="comfortable"
        icon="mdi-trash-can-outline"
        size="small"
        variant="tonal"
        @click="emit('remove:member')"
      />
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import { UserAvatar } from '@tailor-cms/core-components';

interface RoleOption {
  title: string;
  value: string;
  description?: string;
  icon?: string;
}

const props = defineProps<{
  title: string;
  subtitle?: string;
  imgUrl?: string;
  role: string;
  roles: RoleOption[];
}>();

const emit = defineEmits<{
  'update:role': [value: string];
  'remove:member': [];
}>();

const activeRole = computed(() =>
  props.roles.find((option) => option.value === props.role),
);
const roleLabel = computed(() => activeRole.value?.title ?? props.role);

const optionIcon = (value: string) =>
  props.role === value ? 'mdi-check-circle' : 'mdi-blank';
</script>

<style lang="scss" scoped>
:deep(.v-list-item-subtitle) {
  -webkit-line-clamp: unset;
}
</style>
