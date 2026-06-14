<template>
  <VIcon
    v-tooltip:left="{ text: tooltipText, maxWidth: 300, openDelay: 100 }"
    :color="badgeColor"
    icon="mdi-circle"
    size="12"
  />
</template>

<script lang="ts" setup>
import { countBy, filter, map } from 'lodash-es';
import type { Activity } from '@tailor-cms/interfaces/activity';
import { activity as activityUtils } from '@tailor-cms/utils';
import pluralize from 'pluralize-esm';

import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activity: Activity;
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
  return `${descendants} within this ${label} ${pluralize('has', count)}
    unpublished changes.`;
};

const label = computed(() => $schemaService.getActivityLabel(props.activity));
const badgeColor = computed(() =>
  hasChanges.value || subtreeHasChanges.value ? 'warning' : 'success',
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

const tooltipText = computed(() =>
  subtreeHasChanges.value ? descendantsInfo.value : activityInfo.value,
);
</script>
