<template>
  <VSelect
    v-model="selectedId"
    :items="items"
    bg-color="primary-darken-2"
    class="user-group-select"
    item-title="name"
    item-value="id"
    max-width="240"
    min-width="200"
    rounded="pill"
    variant="solo"
    flat
    hide-details
  >
    <template #selection="{ item }">
      <UserGroupAvatar :logo-url="item.logoUrl" class="mr-3" size="x-small" />
      <span class="text-truncate">{{ item.name }}</span>
    </template>
    <template #item="{ item, props: { title, ...restProps } }">
      <VListItem v-bind="restProps">
        <UserGroupAvatar
          :logo-url="item.logoUrl"
          size="x-small"
          class="mr-3"
        />
        <span class="text-truncate">{{ title }}</span>
      </VListItem>
    </template>
  </VSelect>
</template>

<script lang="ts" setup>
import UserGroupAvatar from '@/components/common/UserGroupAvatar.vue';

interface UserGroupOption {
  id: number;
  name: string;
  logoUrl?: string;
}

defineProps<{ items: UserGroupOption[] }>();

const selectedId = defineModel<number | null>();
</script>
