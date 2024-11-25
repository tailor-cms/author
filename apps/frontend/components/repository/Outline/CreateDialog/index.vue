<template>
  <TailorDialog
    :id="dialogTestId"
    v-model="visible"
    :data-testid="dialogTestId"
    header-icon="mdi-folder-plus-outline"
  >
    <template v-if="showActivator" #activator="{ props: activatorProps }">
      <VBtn
        v-bind="activatorProps"
        :color="activatorColor"
        :data-testid="`${props.testIdPrefix}Btn`"
        class="px-2"
        variant="text"
      >
        <VIcon class="mr-2">{{ props.activatorIcon }}</VIcon>
        {{ activatorLabel || defaultModalHeading }}
      </VBtn>
    </template>
    <template #header>{{ heading || defaultModalHeading }}</template>
    <template #body>
      <form class="activity-form" @submit.prevent="submitForm">
        <TypeSelect
          :container-id="`#${dialogTestId}`"
          :disabled="hasSingleTypeOption"
          :options="taxonomyLevels"
          :value="activity.type"
          @change="activity.type = $event"
        />
        <VAlert
          v-if="!metadata"
          class="my-3"
          color="primary-darken-3"
          icon="mdi-information"
          variant="tonal"
          prominent
        >
          Please select the item type you want to add to edit its properties
        </VAlert>
        <MetaInput
          v-for="input in metadata"
          :key="input.key"
          :meta="input"
          :name="`data.${input.key}`"
          @update="setMetaValue"
        />
        <VSpacer />
        <div class="d-flex justify-end pt-5 pb-3">
          <VBtn
            class="mr-2 px-4"
            color="primary-darken-4"
            variant="text"
            @click="visible = false"
          >
            Cancel
          </VBtn>
          <VBtn
            :disabled="submitting"
            :loading="submitting"
            color="primary-darken-2"
            type="submit"
            variant="tonal"
            @click="submitForm"
          >
            Create
          </VBtn>
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
  anchor?: StoreActivity | null;
  heading?: string;
  action?: InsertLocation;
  showActivator?: boolean;
  activatorLabel?: string;
  activatorColor?: string;
  activatorIcon?: string;
  testIdPrefix?: string;
}

const props = withDefaults(defineProps<Props>(), {
  anchor: null,
  heading: '',
  action: InsertLocation.AddAfter,
  showActivator: false,
  activatorLabel: '',
  activatorColor: 'primary-darken-3',
  activatorIcon: 'mdi-folder-plus',
  testIdPrefix: 'repository__createActivity',
});

const emit = defineEmits(['close', 'created', 'expand']);

const currentRepositoryStore = useCurrentRepository();
const activityStore = useActivityStore();
const selectedActivity = useSelectedActivity(props.anchor);
const { $schemaService } = useNuxtApp() as any;

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

const defaultModalHeading = computed(() => {
  const firstTaxonomyOption: any = taxonomyLevels.value[0];
  return hasSingleTypeOption.value ? `Add ${firstTaxonomyOption.label}` : 'Add';
});

const activity = ref(initActivityState(taxonomyLevels.value?.[0]?.type)) as any;

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
    currentRepositoryStore.selectActivity(item.id);
    visible.value = false;
  } finally {
    submitting.value = false;
  }
});

watch(visible, (val) => {
  if (val) return;
  emit('close');
  activity.value = initActivityState(taxonomyLevels.value?.[0]?.type);
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
