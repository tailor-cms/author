<template>
  <div class="d-flex align-center">
    <VTooltip v-for="user in users" :key="user.id" location="bottom">
      <template #activator="{ props: tooltipProps }">
        <UserAvatar
          v-bind="tooltipProps"
          :alt="user.label"
          :aria-describedby="`activeUser-${user.id}`"
          :img-url="user.imgUrl"
          :size="size"
          tabindex="0"
        />
      </template>
      <span :id="`activeUser-${user.id}`">{{ user.label }}</span>
    </VTooltip>
  </div>
</template>

<script lang="ts" setup>
import UserAvatar from './UserAvatar.vue';

interface Props {
  users: any[];
  size?: number | string;
}

withDefaults(defineProps<Props>(), {
  size: 36,
});
</script>
