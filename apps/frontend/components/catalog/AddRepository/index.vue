<template>
  <TailorDialog
    v-if="isAdmin"
    v-model="isVisible"
    header-icon="mdi-folder-plus-outline"
    paddingless
    persistent
  >
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        aria-label="Add repository"
        class="add-repository-btn"
        color="secondary-darken-1"
        prepend-icon="mdi-plus"
        variant="elevated"
      >
        New
      </VBtn>
    </template>
    <template #header>Create</template>
    <template #body>
      <div class="bg-primary-darken-3 px-5 pb-6">
        <VTabs
          v-model="selectedTab"
          bg-color="primary-darken-3"
          selected-class="bg-primary-darken-2"
          grow
          hide-slider
        >
          <VTab
            :value="NEW_TAB"
            aria-label="New repository"
            class="mr-2"
            color="primary-lighten-5"
          >
            New
          </VTab>
          <VTab
            :value="IMPORT_TAB"
            aria-label="Import repository"
            class="ml-2"
            color="primary-lighten-5"
          >
            Import
          </VTab>
        </VTabs>
      </div>
      <form
        class="pa-4 bg-primary-lighten-5"
        novalidate
        @submit.prevent="createRepository"
      >
        <VAlert
          :model-value="!!serverError"
          class="mt-3 mb-5"
          color="secondary"
          icon="mdi-alert"
          closable
          @click:close="serverError = ''"
        >
          {{ serverError }}
        </VAlert>
        <VWindow id="addDialogWindow" v-model="selectedTab">
          <VWindowItem :value="NEW_TAB" class="pt-1 pb-2">
            <VSelect
              v-model="schemaInput"
              :disabled="config.availableSchemas.length === 1"
              :error-messages="errors.schema"
              :items="config.availableSchemas"
              :menu-props="{ attach: '#addDialogWindow' }"
              class="required"
              data-testid="type-input"
              item-title="name"
              item-value="id"
              label="Type"
              placeholder="Select type..."
              variant="outlined"
            />
          </VWindowItem>
          <VWindowItem :value="IMPORT_TAB" class="pt-1">
            <VFileInput
              v-model="archiveInput"
              :clearable="false"
              :error-messages="errors.archive"
              :label="archiveInput ? 'Selected archive' : 'Select archive'"
              accept=".tgz"
              class="mb-2 required"
              name="archive"
              prepend-icon=""
              prepend-inner-icon="mdi-paperclip"
              variant="outlined"
            />
          </VWindowItem>
        </VWindow>
        <div class="dialog-subcontainer">
          <RepositoryNameField
            class="mb-2"
            name="name"
            placeholder="Enter name..."
          />
          <VTextarea
            v-model="descriptionInput"
            :error-messages="errors.description"
            class="required"
            label="Description"
            placeholder="Enter description..."
            variant="outlined"
          />
          <template v-if="isCreate">
            <MetaInput
              v-for="it in schemaMeta"
              :key="it.key"
              :meta="it"
              class="meta-input"
            />
          </template>
          <AIAssistance
            v-if="config.props.aiUiEnabled && selectedTab === NEW_TAB"
            :description="descriptionInput"
            :name="values.name"
            :schema-id="schemaInput"
            @structure="aiSuggestedOutline = $event"
          />
        </div>
        <div class="d-flex justify-end">
          <VBtn
            :disabled="isSubmitting"
            color="primary-darken-4"
            variant="text"
            @click="hide"
          >
            Cancel
          </VBtn>
          <VBtn
            :loading="isSubmitting"
            class="ml-2"
            color="primary-darken-2"
            type="submit"
            variant="tonal"
          >
            Create
          </VBtn>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { ActivityConfig } from '@tailor-cms/interfaces/schema';
import pick from 'lodash/pick';
import pMinDelay from 'p-min-delay';
import { SCHEMAS } from 'tailor-config-shared';
import { useForm } from 'vee-validate';

import AIAssistance from './AIAssistance.vue';
import { repository as api } from '@/api';
import MetaInput from '@/components/common/MetaInput.vue';
import RepositoryNameField from '@/components/common/RepositoryNameField.vue';
import TailorDialog from '@/components/common/TailorDialog.vue';
import { useActivityStore } from '@/stores/activity';
import { useConfigStore } from '@/stores/config';
import { useRepositoryStore } from '@/stores/repository';

const { $schemaService } = useNuxtApp() as any;

const repositoryStore = useRepositoryStore();
const activityStore = useActivityStore();
const config = useConfigStore();

const NEW_TAB = 'schema';
const IMPORT_TAB = 'import';

defineProps<{ isAdmin: boolean }>();

const emit = defineEmits(['created']);

const isVisible = ref(false);
const selectedTab = ref(NEW_TAB);
const isCreate = computed(() => selectedTab.value === NEW_TAB);
const isSubmitting = ref(false);
const serverError = ref('');
const aiSuggestedOutline = ref([]);

const metaValidation = reactive<Record<string, any>>({});

const { defineField, handleSubmit, resetForm, values, errors } = useForm({
  initialValues: {
    schema:
      config.availableSchemas.length === 1
        ? config.availableSchemas[0].id
        : null,
    name: '',
    description: '',
    archive: null,
  },
  validationSchema: computed(() => ({
    schema: { required: selectedTab.value === NEW_TAB },
    name: 'required|min:2|max:250',
    description: 'required|min:2|max:2000',
    archive: { required: selectedTab.value === IMPORT_TAB },
    ...metaValidation,
  })),
});

const [schemaInput] = defineField('schema');
const [descriptionInput] = defineField('description');
const [archiveInput] = defineField('archive');

const schema = computed<ActivityConfig>(
  () => SCHEMAS.find((it) => it.id === schemaInput.value) as any,
);

const schemaMeta = computed(() =>
  schema.value?.meta?.filter((it) => !it.hideOnCreate),
);

const createRepository = handleSubmit(async (formPayload: any) => {
  isSubmitting.value = true;
  const action = isCreate.value ? create : importRepository;
  try {
    await pMinDelay(action(formPayload), 2000);
    emit('created');
    hide();
  } catch {
    serverError.value = 'An error has occurred!';
  }
});

const create = async (formData: any) => {
  const formPayload = {
    ...pick(formData, ['schema', 'name', 'description']),
    data: pick(formData, Object.keys(metaValidation)),
  };
  const repository = await repositoryStore.create(formPayload);
  if (!aiSuggestedOutline.value.length) return;
  // Trigger creation without waiting for completion
  createActvities(repository.id, aiSuggestedOutline.value);
};

const createActvities = (
  repositoryId: number,
  items: any,
  parentId = null as null | number,
) => {
  const outlineLevels = $schemaService.getOutlineLevels(schemaInput.value);
  items.forEach(async (activity: any, index: number) => {
    const type = outlineLevels.find(
      (it: any) => it.label === activity.type,
    ).type;
    const item = await activityStore.save({
      repositoryId,
      parentId,
      type,
      data: { name: activity.name },
      position: index,
    });
    if (item && activity.children)
      createActvities(repositoryId, activity.children, item.id);
  });
};

const importRepository = async ({ archive, name, description }: any) => {
  try {
    const form = new FormData();
    form.append('archive', archive);
    form.append('name', name);
    form.append('description', description);
    const headers = { 'content-type': 'multipart/form-data' };
    await api.importRepository(form, { headers });
  } catch {
    serverError.value = 'An error has occurred!';
  }
};

const hide = () => {
  isVisible.value = false;
  isSubmitting.value = false;
  serverError.value = '';
  resetForm();
};

watch(
  schemaMeta,
  (val) => {
    Object.keys(metaValidation).forEach((key) => delete metaValidation[key]);
    if (!val?.length) return;
    return val.forEach((it) => (metaValidation[it.key] = it.validate));
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.v-alert :deep(.mdi-close) {
  color: #eee;
}

.dialog-subcontainer {
  min-height: 21.5rem;
}
</style>
