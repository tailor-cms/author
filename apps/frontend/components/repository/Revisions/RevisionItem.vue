<template>
  <li>
    <VListItem
      :active="isExpanded"
      :disabled="!isContentElement"
      rounded="lg"
      @click="toggle"
    >
      <template #prepend>
        <VAvatar :color="color" size="42">{{ acronym }}</VAvatar>
      </template>
      <VListItemTitle
        class="text-subtitle-1 text-truncate text-primary-lighten-4"
      >
        {{ description }}
      </VListItemTitle>
      <VListItemSubtitle class="text-body-2 text-primary-lighten-3">
        {{ formatTimeAgo(date, { rounding: 'floor' }) }} by
        {{ revision.user.label }}
      </VListItemSubtitle>
    </VListItem>
    <VFadeTransition>
      <EntityRevisions
        v-if="isExpanded"
        v-bind="{ revision: props.revision, isDetached: !activity }"
      />
    </VFadeTransition>
  </li>
</template>

<script lang="ts" setup>
import find from 'lodash/find';
import { formatTimeAgo } from '@vueuse/core';
import type { Revision } from '@tailor-cms/interfaces/revision';

import {
  getFormatDescription,
  getRevisionAcronym,
  getRevisionColor,
} from '@/lib/revision';
import EntityRevisions from './EntityRevisions.vue';
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

const color = computed(() => getRevisionColor(props.revision));
const acronym = computed(() => getRevisionAcronym(props.revision));
const date = computed(() => new Date(props.revision.createdAt));

const description = computed(() =>
  getFormatDescription(props.revision, activity.value),
);

const isContentElement = computed(
  () => props.revision.entity === 'CONTENT_ELEMENT',
);

const getOutlineLocation: any = (activity: any) => {
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
.v-list-item--disabled {
  opacity: 1;
}
</style>
