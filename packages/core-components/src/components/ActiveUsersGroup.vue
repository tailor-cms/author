<template>
  <VAvatarGroup
    v-if="users.length"
    :items="users"
    :limit="limit"
    :size="size"
    :vertical="vertical"
    :border="vertical ? undefined : 'sm surface opacity-100'"
  >
    <template #item="{ index }">
      <VTooltip :location="tooltipLocation">
        <template #activator="{ props: tooltipProps }">
          <UserAvatar
            v-bind="tooltipProps"
            :alt="users[index]?.label"
            :img-url="users[index]?.imgUrl"
            :size="size"
            tabindex="0"
          />
        </template>
        <span>{{ users[index]?.label }}</span>
      </VTooltip>
    </template>
    <template #overflow="{ overflow }">
      <VMenu :location="tooltipLocation" :open-delay="120" open-on-hover>
        <template #activator="{ props: menuProps }">
          <VAvatar
            v-bind="menuProps"
            :text="`+${overflow}`"
            class="text-caption font-weight-bold"
          />
        </template>
        <VList density="compact" min-width="220">
          <VListSubheader>Active users</VListSubheader>
          <VListItem
            v-for="user in overflowUsers"
            :key="user.id"
            :title="user.label"
          >
            <template #prepend>
              <UserAvatar :img-url="user.imgUrl" size="28" />
            </template>
          </VListItem>
        </VList>
      </VMenu>
    </template>
  </VAvatarGroup>
</template>

<script lang="ts" setup>
import type { User } from '@tailor-cms/interfaces/user';
import { VAvatarGroup } from 'vuetify/labs/VAvatarGroup';

import UserAvatar from './UserAvatar.vue';

const props = withDefaults(
  defineProps<{
    users: User[];
    limit?: number;
    size?: number | string;
    vertical?: boolean;
    tooltipLocation?: 'start' | 'end' | 'top' | 'bottom';
  }>(),
  {
    limit: 4,
    size: 32,
    vertical: false,
    tooltipLocation: 'end',
  },
);

const overflowUsers = computed(() => props.users);
</script>
