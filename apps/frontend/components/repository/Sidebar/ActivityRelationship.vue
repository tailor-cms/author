<template>
  <VAutocomplete
    v-model="input"
    :chips="props.multiple"
    :class="{ required: !props.allowEmpty }"
    :clearable="!props.multiple"
    :disabled="!options.length"
    :error-messages="errors.val"
    :items="groupedOptions"
    :label="props.label"
    :multiple="props.multiple"
    :name="props.type"
    :placeholder="selectPlaceholder"
    item-title="data.name"
    item-value="id"
    variant="outlined"
    closable-chips
    return-object
    @update:model-value="onRelationshipChanged"
  >
    <template #item="{ item, props: autocompleteProps }">
      <VDivider v-if="'divider' in item.raw" />
      <VListSubheader
        v-else-if="'header' in item.raw"
        :title="item.raw.header as string"
        class="text-black text-subtitle-2 font-weight-bold"
      />
      <VListItem
        v-else
        v-bind="autocompleteProps"
        :title="item.title"
        :value="item.value"
      />
    </template>
  </VAutocomplete>
</template>

<script lang="ts" setup>
import castArray from 'lodash/castArray';
import compact from 'lodash/compact';
import filterBy from 'lodash/filter';
import flatMap from 'lodash/flatMap';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import { object } from 'yup';
import pluralize from 'pluralize';
import { useForm } from 'vee-validate';

import { type StoreActivity, useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  activity: StoreActivity;
  type: string;
  label: string;
  multiple: boolean;
  allowEmpty: boolean;
  placeholder: string;
  allowCircularLinks: boolean;
  allowInsideLineage: boolean;
  allowedTypes: string[];
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  allowEmpty: true,
  placeholder: 'Click to select',
  allowCircularLinks: false,
  allowInsideLineage: false,
});

const { $schemaService } = useNuxtApp() as any;
const repositoryStore = useCurrentRepository();
const activityStore = useActivityStore();

const { defineField, errors } = useForm({
  validationSchema: object({ value: object() }),
});
const [input] = defineField('value');

const onRelationshipChanged = (value: any) => {
  const associations = compact(castArray(value));
  const key = `refs.${props.type}`;
  const payload = { id: props.activity.id, [key]: map(associations, 'id') };
  return activityStore.update(payload);
};

const selectPlaceholder = computed(() => {
  return isEmpty(options.value) ? 'No activities' : props.placeholder;
});

const options = computed(() => {
  if (!repositoryStore.repository) return [];
  const { allowedTypes: config } = props;
  const { schema } = repositoryStore.repository;
  const prefixWithSchema = (type: string) =>
    type.includes(`${schema}/`) ? type : `${schema}/${type}`;
  const allowedTypes = config
    ? config.map((it: string) => prefixWithSchema(it))
    : [];
  return filterBy(repositoryStore.outlineActivities, (it) => {
    if (allowedTypes.length && !allowedTypes.includes(it.type)) return false;
    if (!props.allowCircularLinks && it.id === props.activity.id) return false;
    if (!props.allowInsideLineage) {
      const lineage = activityStore.getLineage(props.activity.id);
      if (lineage.map((val) => val.id).includes(it.id)) return false;
    }
    return true;
  });
});

const groupedOptions = computed(() => {
  const grouped = groupBy(options.value, 'type');
  return flatMap(grouped, (it, type) => {
    const headerLabel = $schemaService.getLevel(type).label;
    return [{ header: pluralize(headerLabel) }, { divider: true }, ...it];
  });
});

const updateValue = () => {
  const key = `refs.${props.type}`;
  const ids = get(props.activity, key);
  if (!ids) return;
  const items = ids
    .map((id: number) => activityStore.findById(id))
    .filter(Boolean);
  input.value = items;
};
onBeforeMount(() => updateValue());
watch(
  () => props.activity,
  () => updateValue(),
);
</script>
