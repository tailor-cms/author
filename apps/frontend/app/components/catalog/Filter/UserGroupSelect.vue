<template>
  <VSelect
    v-model="selectedId"
    :items="items"
    bg-color="primary-darken-2"
    class="user-group-select"
    flat
    hide-details
    item-title="name"
    item-value="id"
    max-width="240"
    min-width="200"
    rounded="pill"
    variant="solo"
  >
    <template #selection="{ item }">
      <UserGroupAvatar :logo-url="item.raw.logoUrl" :size="24" class="mr-2" />
      <span class="text-truncate">{{ item.title }}</span>
    </template>
    <template #item="{ item, props: { title, ...restProps } }">
      <VListItem v-bind="restProps">
        <UserGroupAvatar
          :logo-url="item.raw.logoUrl"
          class="mr-3"
          placeholder-color="primary-darken-3"
        />
        {{ title }}
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
