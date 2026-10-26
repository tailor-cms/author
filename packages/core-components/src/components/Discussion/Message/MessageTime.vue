<template>
  <span v-tooltip:top="fullDate" class="message-time">{{ text }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useDateFormat, useTimeAgo } from '@vueuse/core';
import { dayLabel } from '../dayLabel';

// When a message was posted, with the full date on hover
const props = defineProps<{
  at: string;
  // "3 hours ago" instead of the clock time
  isRelative?: boolean;
  // "Today at 14:05", where no day divider says when it was
  hasDay?: boolean;
}>();

const at = () => props.at;
const clock = useDateFormat(at, 'HH:mm');
const fullDate = useDateFormat(at, 'DD MMM YYYY HH:mm');
const timeAgo = useTimeAgo(at);

const text = computed(() => {
  if (props.isRelative) return timeAgo.value;
  if (!props.hasDay) return clock.value;
  return `${dayLabel(new Date(props.at))} at ${clock.value}`;
});
</script>
