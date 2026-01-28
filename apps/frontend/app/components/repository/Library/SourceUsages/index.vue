<template>
  <VProgressCircular
    v-if="isLoading"
    color="primary-darken-4"
    size="16"
    width="2"
    indeterminate
  />
  <VCard
    v-else-if="hasCopies"
    class="d-flex align-center pa-2 ga-2"
    variant="tonal"
  >
    <VTooltip location="bottom" open-delay="500">
      <template #activator="{ props: tooltipProps }">
        <span
          v-bind="tooltipProps"
          class="d-flex align-center text-body-2 text-uppercase font-weight-bold"
        >
          <VIcon color="purple" icon="mdi-source-branch" size="small" start />
          Source
        </span>
      </template>
      This is a source - linked content exists
    </VTooltip>
    <VBadge :content="copies.length" color="lime" inline>
      <span class="text-caption pl-1 pr-2">
        {{ pluralize('copy', copies.length) }}
      </span>
    </VBadge>
    <VSpacer />
    <CopiesMenu :copies="copies" @select="$emit('copy:view', $event)" />
  </VCard>
</template>

<script lang="ts" setup>
import pluralize from 'pluralize-esm';
import type { Activity } from '@tailor-cms/interfaces/activity';
import { activity as activityApi } from '@/api';

import CopiesMenu, { type Copy } from './CopiesMenu.vue';

const props = defineProps<{ activity: Activity }>();
defineEmits<{ 'copy:view': [copy: Copy] }>();

const isLoading = ref(false);
const copies = ref<Copy[]>([]);
const hasCopies = computed(() => copies.value.length > 0);

const fetchCopies = async () => {
  isLoading.value = true;
  try {
    const { repositoryId, id } = props.activity;
    const data = await activityApi.getCopies(repositoryId, id);
    copies.value = data.copies;
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchCopies);

watch(() => props.activity.id, fetchCopies);
</script>
