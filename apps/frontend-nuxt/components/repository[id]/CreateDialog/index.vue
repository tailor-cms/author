<template>
  <TailorDialog
    v-model="visible"
    :data-testid="`${props.testIdPrefix}Dialog`"
    header-icon="mdi-folder-plus-outline"
  >
    <template v-if="showActivator" #activator="{ props: activatorProps }">
      <VButton
        v-bind="activatorProps"
        :color="activatorColor"
        :data-testid="`${props.testIdPrefix}Btn`"
        variant="text"
        class="px-1"
      >
        <VIcon class="pr-1">{{ props.activatorIcon }}</VIcon>
        {{ activatorLabel || defaultModalHeading }}
      </VButton>
    </template>
    <template #header>{{ heading || defaultModalHeading }}</template>
    <template #body>
      <form @submit.prevent="submitForm" class="activity-form">
        <TypeSelect
          :disabled="hasSingleTypeOption"
          :options="taxonomyLevels"
          :value="activity.type"
          @change="activity.type = $event"
        />
        <VAlert
          v-if="!metadata"
          class="my-3"
          color="primary-darken-2"
          icon="mdi-information"
          variant="text"
          prominent
        >
          Please select the item type you want to add to edit its properties
        </VAlert>
        <MetaInput
          v-for="input in metadata"
          :key="input.key"
          :meta="input"
          @update="setMetaValue"
        />
        <VSpacer />
        <div class="d-flex justify-end pt-5 pb-3">
          <VButton class="px-4" variant="text" @click="visible = false">
            Cancel
          </VButton>
          <VButton
            :disabled="submitting"
            :loading="submitting"
            color="primary-darken-4"
            type="submit"
            variant="tonal"
            @click="submitForm">
            Create
          </VButton>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import InsertLocation from '@/lib/InsertLocation';
import MetaInput from '@/components/common/MetaInput.vue';
import type { StoreActivity } from '@/stores/activity';
import TailorDialog from '@/components/common/TailorDialog.vue';
import TypeSelect from './TypeSelect.vue';
import { useActivityStore } from '@/stores/activity';

const props = defineProps({
  repositoryId: { type: Number, required: true },
  anchor: { type: Object, default: null },
  heading: { type: String, default: '' },
  action: { type: String, default: InsertLocation.ADD_AFTER },
  showActivator: { type: Boolean, default: false },
  activatorLabel: { type: String, default: '' },
  activatorColor: { type: String, default: 'grey darken-3' },
  activatorIcon: { type: String, default: 'mdi-folder-plus' },
  testIdPrefix: { type: String, default: 'repository__createActivity' },
});

const emit = defineEmits(['close', 'created', 'expand']);

const activityStore = useActivityStore();
const selectedActivity = useSelectedActivity();
const { $schemaService } = useNuxtApp() as any;

const initActivityState = () => {
  const { value: levels }: any = selectedActivity.levels;
  return {
    repositoryId: props.repositoryId,
    type: levels.length > 1 ? levels[0]?.type : null,
    data: {},
  }
};

const visible = ref(false);
const submitting = ref(false);

const taxonomyLevels = ref(selectedActivity.levels);
const hasSingleTypeOption = computed(() => taxonomyLevels.value.length === 1);

const defaultModalHeading = computed(() => {
  const firstTaxonomyOption: any = taxonomyLevels.value[0];
  return hasSingleTypeOption.value ? `Add ${firstTaxonomyOption.label}` : 'Add';
});

const activity = ref(initActivityState()) as any;

const metadata = computed(() => {
  if (!activity.value.type) return null;
  return $schemaService.getActivityMetadata(activity.value);
});

const setMetaValue = (key: string, val: any) => {
  activity.value.data[key] = val;
};

const submitForm = async () => {
  const { anchor, action } = props;
  submitting.value = true;
  if (anchor) {
    activity.value.parentId =
      action === InsertLocation.ADD_INTO ? anchor.id : anchor.parentId;
  }
  activity.value.position = await activityStore.calculateInsertPosition(
    activity,
    action,
    anchor as StoreActivity,
  );
  try {
    const item = await activityStore.save(activity.value);
    if (anchor && anchor.id === activity.value?.parentId) {
      selectedActivity.expandParent(item);
    }
    emit('created', item);
    visible.value = false;
    navigateTo({ query: { activityId: item.id } });
  } finally {
    submitting.value = false;
  }
};

watch(visible, (val) => {
  if (val) return;
  emit('close');
  activity.value = initActivityState();
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
