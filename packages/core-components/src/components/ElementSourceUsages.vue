<template>
  <VMenu
    v-model="menuOpen"
    :close-on-content-click="false"
    class="element-source-usages"
    location="left"
    max-height="400"
    offset="4"
  >
    <template #activator="{ props: menuProps }">
      <VTooltip :disabled="menuOpen" location="left" open-delay="1000">
        <template #activator="{ props: tooltipProps }">
          <VBadge
            :color="badgeColor"
            :content="usages?.length ?? '?'"
            offset-x="-2"
            offset-y="-2"
          >
            <VBtn
              v-bind="{ ...menuProps, ...tooltipProps }"
              aria-label="Source usages"
              color="purple"
              icon="mdi-source-fork"
              size="x-small"
              variant="tonal"
            />
          </VBadge>
        </template>
        Linked copies
      </VTooltip>
    </template>
    <VSheet min-width="280" rounded="lg">
      <div class="px-4 pt-3 pb-2 text-caption text-medium-emphasis text-uppercase">
        Linked Copies
      </div>
      <VDivider />
      <div v-if="isLoading" class="d-flex justify-center py-4">
        <VProgressCircular color="primary" size="24" indeterminate />
      </div>
      <template v-else-if="usages?.length">
        <VList density="compact">
          <VListItem
            v-for="usage in usages"
            :key="usage.uid"
            :subtitle="usage.outlineActivityName"
            :title="usage.repositoryName"
            append-icon="mdi-open-in-new"
            link
            @click="onViewUsage(usage)"
          />
        </VList>
      </template>
      <div v-else class="px-4 py-3 text-body-2 text-medium-emphasis">
        No linked copies found
      </div>
    </VSheet>
  </VMenu>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';

interface Usage {
  id: number;
  uid: string;
  repositoryId: number;
  repositoryName: string;
  activityId: number;
  outlineActivityId: number;
  outlineActivityName: string;
  linkedAt: string;
}

interface Props {
  element: ContentElement;
  usages?: Usage[] | null;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  usages: null,
  isLoading: false,
});

const emit = defineEmits<{
  'usages:fetch': [];
  'usage:view': [usage: Usage];
}>();

const menuOpen = ref(false);

const badgeColor = computed(() => {
  if (!props.usages) return 'grey';
  return props.usages.length > 0 ? 'purple' : 'grey';
});

const onViewUsage = (usage: Usage) => {
  emit('usage:view', usage);
  menuOpen.value = false;
};

watch(menuOpen, (open) => {
  if (open && !props.usages && !props.isLoading) {
    emit('usages:fetch');
  }
});
</script>
