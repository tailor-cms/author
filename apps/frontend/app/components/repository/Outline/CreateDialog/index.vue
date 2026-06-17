<template>
  <TailorDialog
    :id="dialogTestId"
    v-model="visible"
    :data-testid="dialogTestId"
    header-icon="mdi-folder-plus-outline"
  >
    <template v-if="showActivator" #activator="{ props: activatorProps }">
      <VBtn
        v-bind="{ ...activatorProps, ...$attrs }"
        :color="activatorColor"
        :data-testid="`${testIdPrefix}Btn`"
        :prepend-icon="activatorIcon"
        :size="size"
        :text="activatorLabel || defaultModalHeading"
        :variant="variant"
      />
    </template>
    <template #header>{{ heading || defaultModalHeading }}</template>
    <template #body>
      <form class="activity-form" @submit.prevent="submitForm">
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
        <VSpacer />
        <div class="d-flex justify-end pt-5 pb-3">
          <VBtn
            class="mr-2 px-4"
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
            @click="submitForm"
          />
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { InsertLocation } from '@tailor-cms/utils';
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';

import TypeSelect from './TypeSelect.vue';
import MetaInput from '@/components/common/MetaInput.vue';
import type { StoreActivity } from '@/stores/activity';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  repositoryId: number;
  size?: string;
  variant?: string;
  anchor?: StoreActivity | null;
  heading?: string;
  action?: InsertLocation;
  showActivator?: boolean;
  activatorLabel?: string;
  activatorColor?: string;
  activatorIcon?: string;
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
  showActivator: false,
  activatorLabel: '',
  size: 'default',
  variant: 'text',
  activatorColor: undefined,
  activatorIcon: 'mdi-folder-plus',
  testIdPrefix: 'repository__createActivity',
  defaultType: undefined,
  openInEditor: false,
});

const emit = defineEmits(['close', 'created', 'expand']);

const currentRepositoryStore = useCurrentRepository();
const activityStore = useActivityStore();
const selectedActivity = useSelectedActivity(props.anchor);
const { $schemaService, $i18n } = useNuxtApp() as any;

// Check if i18n is enabled to show creation hint
const showI18nHint = computed(() => $i18n?.isEnabled);

const initActivityState = (type: string) => {
  return {
    repositoryId: props.repositoryId,
    type,
    data: {},
  };
};

const visible = ref(false);
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
  try {
    const item = (await activityStore.save(activity.value)) as StoreActivity;
    if (anchor && anchor.id === activity.value?.parentId) {
      selectedActivity.expandOutlineItemParent(item);
    }
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
  } finally {
    submitting.value = false;
  }
});

watch(visible, (val) => {
  if (!val) emit('close');
  activity.value = initActivityState(resolveInitialType());
});

onMounted(() => {
  visible.value = !props.showActivator;
});
</script>

<style lang="scss" scoped>
.activity-form {
  display: flex;
  flex-direction: column;
  min-height: 17rem;
  padding-top: 0.5rem;
}
</style>
