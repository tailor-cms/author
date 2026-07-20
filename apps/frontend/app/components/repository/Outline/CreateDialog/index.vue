<template>
  <TailorDialog
    :id="dialogTestId"
    v-model="visible"
    :data-testid="dialogTestId"
    :title="heading || defaultModalHeading"
    header-icon="mdi-folder-plus-outline"
    scrollable
    @submit="submitForm"
  >
    <template #body>
      <TypeSelect
        :container-id="`#${dialogTestId}`"
        :disabled="isTypeLocked"
        :options="taxonomyLevels"
        :value="activity.type"
        @change="activity.type = $event"
      />
      <VAlert
        v-if="!metadata"
        :text="'Please select the item type you want to add to edit its properties'"
        class="mb-3"
        density="comfortable"
        icon="mdi-information-outline"
        variant="tonal"
      />
      <MetaInput
        v-for="input in metadata"
        :key="input.key"
        :meta="input"
        :name="`data.${input.key}`"
        is-new
        @update="setMetaValue"
      />
      <VAlert
        v-if="showI18nHint"
        :text="'Items are created in the default language'"
        class="mb-3"
        icon="mdi-information-outline"
        variant="tonal"
      />
    </template>
    <template #actions>
      <VBtn
        text="Cancel"
        variant="text"
        @click="visible = false"
      />
      <VBtn
        :disabled="submitting"
        :loading="submitting"
        color="primary"
        text="Create"
        type="submit"
        variant="flat"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { InsertLocation } from '@tailor-cms/utils';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';
import pluralize from 'pluralize-esm';

import type { StoreActivity } from '@/stores/activity';
import TypeSelect from './TypeSelect.vue';
import MetaInput from '@/components/common/MetaInput.vue';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  repositoryId: number;
  anchor?: StoreActivity | null;
  heading?: string;
  action?: InsertLocation;
  testIdPrefix?: string;
  // Pre-selected
  defaultType?: string;
  // Navigate straight into the editor after creating
  openInEditor?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  anchor: null,
  heading: '',
  action: InsertLocation.AddAfter,
  testIdPrefix: 'repository__createActivity',
  defaultType: undefined,
  openInEditor: false,
});

const emit = defineEmits(['close', 'created', 'expand']);

const { $schemaService, $i18n } = useNuxtApp() as any;

const currentRepositoryStore = useCurrentRepository();
const activityStore = useActivityStore();
const selectedActivity = useSelectedActivity(props.anchor);

const notify = useNotification();

// Check if i18n is enabled to show creation hint
const showI18nHint = computed(() => $i18n?.isEnabled);

const initActivityState = (type: string) => {
  return {
    repositoryId: props.repositoryId,
    type,
    data: {},
  };
};

const visible = ref(true);
const submitting = ref(false);

const { handleSubmit } = useForm();

const dialogTestId = computed(() => `${props.testIdPrefix}Dialog`);

const taxonomyLevels = computed<any[]>(() => {
  const { subLevels, sameLevel } = selectedActivity;
  const isAddInto = props.action === InsertLocation.AddInto;
  return isAddInto ? subLevels.value : sameLevel.value;
});

const hasSingleTypeOption = computed(() => taxonomyLevels.value.length === 1);

// The type picker is locked to a single value when only one type is selectable
const isDefaultTypeAvailable = computed(() =>
  taxonomyLevels.value.some((it: any) => it.type === props.defaultType),
);

const isTypeLocked = computed(
  () => hasSingleTypeOption.value || isDefaultTypeAvailable.value,
);

// The type the form opens on: the pinned default when selectable, else the first.
const resolveInitialType = () =>
  (isDefaultTypeAvailable.value ? props.defaultType : null) ??
  taxonomyLevels.value?.[0]?.type;

const initialTypeLabel = computed(
  () =>
    taxonomyLevels.value.find((it: any) => it.type === resolveInitialType())
      ?.label ?? '',
);

const defaultModalHeading = computed(() =>
  isTypeLocked.value ? `Add ${initialTypeLabel.value}` : 'Add',
);

const activity = ref(initActivityState(resolveInitialType())) as any;

const metadata = computed(() => {
  if (!activity.value.type) return null;
  return $schemaService
    .getActivityMetadata(activity.value)
    .filter((it: Metadata) => !it.hideOnCreate);
});

const setMetaValue = (key: string, val: any) => {
  activity.value.data[key] = val;
};

const submitForm = handleSubmit(async () => {
  const { anchor, action } = props;
  submitting.value = true;
  if (anchor) {
    activity.value.parentId =
      action === InsertLocation.AddInto ? anchor.id : anchor.parentId;
  }
  activity.value.position = await activityStore.calculateInsertPosition(
    activity.value,
    action,
    anchor as StoreActivity,
  );
  // Singularized - collection entity labels are plural
  const label = pluralize.singular(
    $schemaService.getActivityLabel(activity.value) || 'item',
  );
  try {
    const item = (await activityStore.save(activity.value)) as StoreActivity;
    if (anchor && anchor.id === activity.value?.parentId) {
      selectedActivity.expandOutlineItemParent(item);
    }
    notify(`A new ${label} has been created`);
    emit('created', item);
    visible.value = false;
    if (props.openInEditor) {
      await navigateTo({
        name: 'editor',
        params: { id: props.repositoryId, activityId: item.id },
      });
    } else {
      currentRepositoryStore.selectActivity(item.id);
    }
  } catch {
    notify(`We couldn't create the ${label}`, { color: 'error' });
  } finally {
    submitting.value = false;
  }
});

watch(visible, (val) => {
  if (!val) emit('close');
  activity.value = initActivityState(resolveInitialType());
});
</script>
