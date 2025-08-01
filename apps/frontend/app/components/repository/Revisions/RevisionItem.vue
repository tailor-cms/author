<template>
  <li>
    <VListItem
      :active="isExpanded"
      :class="{ 'rounded-b-0': isExpanded }"
      :disabled="!isContentElement"
      class="revision"
      rounded="lg"
      @click="toggle"
    >
      <template #prepend>
        <VAvatar color="primary-lighten-3" size="42">{{ acronym }}</VAvatar>
      </template>
      <VListItemTitle
        class="text-subtitle-1 text-truncate text-primary-lighten-5"
      >
        {{ description }}
      </VListItemTitle>
      <VListItemSubtitle class="text-body-2 text-primary-lighten-4">
        {{ formatTimeAgo(date, { rounding: 'floor' }) }} by
        {{ revision.user.label }}
      </VListItemSubtitle>
    </VListItem>
    <VFadeTransition>
      <EntityRevisions
        v-if="isExpanded"
        :is-detached="!activity"
        :revision="props.revision"
      />
    </VFadeTransition>
  </li>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import { find } from 'lodash-es';
import { formatTimeAgo } from '@vueuse/core';
import type { Revision } from '@tailor-cms/interfaces/revision';

import EntityRevisions from './EntityRevisions.vue';
import { getFormatDescription, getRevisionAcronym } from '@/lib/revision';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const activityStore = useActivityStore();
const currentRepositoryStore = useCurrentRepository();

const props = defineProps<{ revision: Revision }>();

const isExpanded = ref(false);

const activity = computed(() => {
  const { state } = props.revision;
  const activityId = (state.activityId || state.id) as number;
  return getOutlineLocation(activityStore.getParent(activityId));
});

const acronym = computed(() => getRevisionAcronym(props.revision));
const date = computed(() => new Date(props.revision.createdAt));

const description = computed(() =>
  getFormatDescription(props.revision, activity.value),
);

const isContentElement = computed(
  () => props.revision.entity === 'CONTENT_ELEMENT',
);

const getOutlineLocation: any = (activity: Activity) => {
  if (!activity) return null;
  const level = find(currentRepositoryStore.taxonomy, { type: activity.type });
  if (level) return { ...activity, label: level.label };
  return getOutlineLocation(activityStore.getParent(activity.id));
};

const toggle = () => {
  if (isContentElement.value) isExpanded.value = !isExpanded.value;
};
</script>

<style lang="scss" scoped>
li + li {
  margin-top: 0.5rem;
}

.revision.v-list-item {
  transition: all 0.3s ease;

  &.v-list-item--disabled {
    opacity: 1;
  }

  .v-list-item-subtitle {
    opacity: 1;
  }
}
</style>
