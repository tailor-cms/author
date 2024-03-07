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
        class="add-repo"
        color="secondary"
        position="absolute"
        prepend-icon="mdi-plus"
        variant="elevated"
      >
        Add
      </VBtn>
    </template>
    <template #header>Add</template>
    <template #body>
      <VTabs
        v-model="selectedTab"
        bg-color="primary-darken-3"
        slider-color="secondary-lighten-2"
        grow
      >
        <VTab :value="NEW_TAB">New</VTab>
        <VTab :value="IMPORT_TAB">Import</VTab>
      </VTabs>
      <form class="mt-4 pa-4" novalidate @submit.prevent="createRepository">
        <VAlert
          :model-value="!!serverError"
          class="mb-12"
          color="secondary"
          icon="mdi-alert"
          closable
          @click:close="serverError = ''"
        >
          {{ serverError }}
        </VAlert>
        <v-window v-model="selectedTab">
          <v-window-item :value="NEW_TAB" class="pt-1 pb-2">
            <VSelect
              v-model="schemaInput"
              :error-messages="errors.schema"
              :items="SCHEMAS"
              item-title="name"
              item-value="id"
              label="Type"
              variant="outlined"
            />
          </v-window-item>
          <v-window-item :value="IMPORT_TAB" class="pt-1">
            <VFileInput
              v-model="archiveInput"
              :clearable="false"
              :error-messages="errors.archive"
              :label="archiveInput ? 'Selected archive' : 'Select archive'"
              prepend-icon=""
              prepend-inner-icon="mdi-paperclip"
              variant="outlined"
            />
          </v-window-item>
        </v-window>
        <RepositoryNameField
          v-model="nameInput"
          :is-validated="!!errors.name?.length"
          class="mb-2"
          name="name"
          placeholder="Enter name..."
        />
        <VTextarea
          v-model="descriptionInput"
          :error-messages="errors.description"
          label="Description"
          placeholder="Enter description..."
          variant="outlined"
        />
        <AIAssistance
          v-if="runtimeConfig.public.aiUiEnabled"
          :description="descriptionInput"
          :name="nameInput"
          :schema-id="schemaInput"
          @structure="aiSuggestedOutline = $event"
        />
        <div class="d-flex justify-end">
          <VBtn
            :disabled="showLoader"
            color="primary-darken-4"
            variant="text"
            @click="hide"
          >
            Cancel
          </VBtn>
          <VBtn
            :loading="showLoader"
            color="primary-darken-4"
            type="submit"
            variant="text"
          >
            Create
          </VBtn>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { array, object, string } from 'yup';
import pMinDelay from 'p-min-delay';
import { SCHEMAS } from 'tailor-config-shared';
import { useForm } from 'vee-validate';

import AIAssistance from './AIAssistance.vue';
import { repository as api } from '@/api';
import RepositoryNameField from '@/components/common/RepositoryNameField.vue';
import TailorDialog from '@/components/common/TailorDialog.vue';
import { useActivityStore } from '@/stores/activity';
import { useRepositoryStore } from '@/stores/repository';

defineProps<{ isAdmin: boolean }>();
const emit = defineEmits(['done']);

const NEW_TAB = 'schema';
const IMPORT_TAB = 'import';

const { $schemaService } = useNuxtApp() as any;
const runtimeConfig = useRuntimeConfig();
const repositoryStore = useRepositoryStore();
const activityStore = useActivityStore();

const selectedTab = ref(NEW_TAB);
const isCreate = computed(() => selectedTab.value === NEW_TAB);
const isVisible = ref(false);
const showLoader = ref(false);
const serverError = ref('');
const aiSuggestedOutline = ref([]);

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    schema: string().when((_, schema) => {
      return selectedTab.value === NEW_TAB
        ? schema.required()
        : schema.notRequired();
    }),
    name: string().required().min(2).max(2000),
    description: string().required().min(2).max(2000),
    archive: array().when((_, schema) => {
      return selectedTab.value === IMPORT_TAB
        ? schema.required()
        : schema.notRequired();
    }),
  }),
});

const [schemaInput] = defineField('schema');
const [nameInput] = defineField('name');
const [descriptionInput] = defineField('description');
const [archiveInput] = defineField('archive');

const resetData = () => {
  schemaInput.value = SCHEMAS[0].id;
  nameInput.value = '';
  descriptionInput.value = '';
  archiveInput.value = null;
};

const createRepository = handleSubmit(async (formPayload) => {
  showLoader.value = true;
  const action = isCreate.value ? create : importRepository;
  try {
    await pMinDelay(action(formPayload), 2000);
    emit('done');
    hide();
  } catch (error) {
    serverError.value = 'An error has occurred!';
  }
});

const create = async (formPayload: {
  schema: string;
  name: string;
  description: string;
}) => {
  const repository = await repositoryStore.create(formPayload);
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
    if (activity.children)
      createActvities(repositoryId, activity.children, item.id);
  });
};

const importRepository = async ({ archive, name, description }: any) => {
  const form = new FormData();
  form.append('archive', archive[0]);
  form.append('name', name);
  form.append('description', description);
  const headers = { 'content-type': 'multipart/form-data' };
  await api.importRepository(form, { headers });
};

const hide = () => {
  showLoader.value = false;
  isVisible.value = false;
  serverError.value = '';
  resetData();
  resetForm();
};
</script>

<style lang="scss" scoped>
::v-deep .v-list.v-sheet {
  text-align: left;
}
</style>
