<template>
  <!-- eslint-disable
    vuejs-accessibility/click-events-have-key-events,
    vuejs-accessibility/no-static-element-interactions -->
  <li>
    <!-- TODO: Migrate expansion once we have elements with disabled state -->
    <div
      :class="{ isExpanded, expandable: false && isContentElement }"
      :style="{ cursor: false && isContentElement ? 'pointer' : 'auto' }"
      class="revision"
      @click="toggle"
    >
      <VAvatar :color="color" size="42">{{ acronym }}</VAvatar>
      <div class="content ml-3">
        <div class="text-subtitle-1 text-truncate text-primary-lighten-4">
          {{ description }}
        </div>
        <div class="text-body-2 text-primary-lighten-2">
          {{ formatTimeAgo(date, { rounding: 'floor' }) }} by
          {{ revision.user.label }}
        </div>
      </div>
    </div>
    <!-- <EntityRevisions
      v-if="isExpanded"
      v-bind="{ revision: props.revision, isDetached: !activity }"
    /> -->
  </li>
</template>

<script lang="ts" setup>
import find from 'lodash/find';
import { formatTimeAgo } from '@vueuse/core';

import {
  getFormatDescription,
  getRevisionAcronym,
  getRevisionColor,
} from '@/lib/revision';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

// TODO: Needs to be migrated
// import EntityRevisions from './EntityRevisions.vue';

const activityStore = useActivityStore();
const currentRepositoryStore = useCurrentRepository();

const props = defineProps<{ revision: Record<string, any> }>();

const isExpanded = ref(false);

const activity = computed(() => {
  const { state } = props.revision;
  const activityId = state.activityId || state.id;
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
.revision {
  display: flex;
  align-items: center;
  min-height: 4.5rem;
  padding: 0 1rem;

  .content {
    flex: 1;
    overflow: hidden;
  }
}

.expandable.isExpanded,
.expandable.revision:hover {
  background-color: #dadada;
}
</style>
