<template>
  <span v-tooltip:top="tooltip" class="message-time">{{ text }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useDateFormat, useTimeAgo } from '@vueuse/core';

// When a message was posted, with the full date on hover
const props = defineProps<{
  at: string;
  // "3 hours ago" instead of the clock time
  isRelative?: boolean;
}>();

const at = () => props.at;
const clock = useDateFormat(at, 'HH:mm');
const fullDate = useDateFormat(at, 'DD MMM YYYY HH:mm');
const timeAgo = useTimeAgo(at);

const text = computed(() => (props.isRelative ? timeAgo.value : clock.value));

const tooltip = computed(() =>
  props.isRelative ? fullDate.value : `${fullDate.value} · ${timeAgo.value}`,
);
</script>
