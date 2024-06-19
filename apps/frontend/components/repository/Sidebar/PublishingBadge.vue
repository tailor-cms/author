<template>
  <VTooltip location="left" max-width="300" open-delay="100">
    <template #activator="{ props: tooltipProps }">
      <span v-bind="tooltipProps">
        <VBadge :color="badgeColor" dot inline />
      </span>
    </template>
    <span v-if="subtreeHasChanges">{{ descendantsInfo }}</span>
    <span v-else>{{ activityInfo }}</span>
  </VTooltip>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';
import countBy from 'lodash/countBy';
import filter from 'lodash/filter';
import map from 'lodash/map';
import pluralize from 'pluralize';

import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activity: Object;
}>();

const { getDescendants, isChanged } = activityUtils;
const { $schemaService } = useNuxtApp() as any;

const store = useCurrentRepository();

const getDescriptor = (count: number, type: string) =>
  `${count} ${pluralize(type, count)}`;

const arrayToSentence = (arr: string[]) =>
  arr.join(', ').replace(/, ([^,]*)$/, ' and $1');

const getActivityInfo = (hasChanges: boolean, label: string) =>
  hasChanges ? `${label} has unpublished changes.` : `${label} is published.`;

const getDescendantsInfo = (
  descendants: string,
  count: number,
  label: string,
) => {
  return `${descendants} within this ${label} ${pluralize(
    'has',
    count,
  )} unpublished changes.`;
};

const label = computed(() => $schemaService.getActivityLabel(props.activity));
const badgeColor = computed(() =>
  hasChanges.value || subtreeHasChanges.value
    ? 'orange-lighten-3'
    : 'teal-lighten-2',
);

const hasChanges = computed(() => isChanged(props.activity));
const changedDescendants = computed(() =>
  filter(getDescendants(store.outlineActivities, props.activity), isChanged),
);
const subtreeHasChanges = computed(() => !!changedDescendants.value.length);

const activityInfo = computed(() =>
  getActivityInfo(hasChanges.value, label.value),
);
const descendantsInfo = computed(() => {
  const labelCountMap = countBy(
    changedDescendants.value,
    $schemaService.getActivityLabel,
  );
  const descendants = arrayToSentence(map(labelCountMap, getDescriptor));
  return getDescendantsInfo(
    descendants,
    changedDescendants.value.length,
    label.value,
  );
});
</script>

<style lang="scss" scoped>
::v-deep .v-badge {
  margin: 0 0.125rem 0 0;
}
</style>
