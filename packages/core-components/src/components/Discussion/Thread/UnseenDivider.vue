<template>
  <TimelineDivider
    :text="label"
    class="unseen-divider my-4"
    color="secondary"
    icon="mdi-arrow-down"
    is-closable
    @click="emit('seen')"
    @close="emit('seen')"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import pluralize from 'pluralize-esm';
import TimelineDivider from '../TimelineDivider.vue';

const props = defineProps<{ count: number }>();
const emit = defineEmits(['seen']);

const label = computed(
  () => `${props.count} new ${pluralize('comment', props.count, false)}`,
);
</script>
