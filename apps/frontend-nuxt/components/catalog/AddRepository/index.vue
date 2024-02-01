<template>
  <TailorDialog
    v-if="isAdmin"
    v-model="isVisible"
    header-icon="mdi-folder-plus-outline"
    paddingless
    persistent
  >
    <template v-slot:activator="{ props }">
      <VBtn
        v-bind="props"
        aria-label="Add repository"
        class="add-repo"
        color="secondary"
        icon="mdi-plus"
        position="absolute"
        size="x-large"
        variant="elevated"
      >
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
      <form @submit.prevent="createRepository" novalidate class="mt-4 pa-4">
        <VAlert
          @click:close="serverError = ''"
          :model-value="!!serverError"
          color="secondary"
          icon="mdi-alert"
          closable
          class="mb-12"
        >
          {{ serverError }}
        </VAlert>
        <v-window v-model="selectedTab">
          <v-window-item :value="NEW_TAB" class="pt-1">
            <VSelect
              v-model="schemaInput"
              :items="SCHEMAS"
              :error-messages="errors.schema"
              item-value="id"
              item-title="name"
              label="Type"
              variant="outlined"
            />
          </v-window-item>
          <v-window-item :value="IMPORT_TAB" class="pt-1">
            <VFileInput
              v-model="archiveInput"
              :error-messages="errors.archive"
              :clearable="false"
              :label="archive ? 'Selected archive' : 'Select archive'"
              prepend-icon=""
              prepend-inner-icon="mdi-paperclip"
              variant="outlined"
            />
          </v-window-item>
        </v-window>
        <RepositoryNameField
          v-model="nameInput"
          name="name"
          placeholder="Enter name..."
          class="mb-2"
        />
        <VTextarea
          v-model.trim="descriptionInput"
          :error-messages="errors.description"
          label="Description"
          placeholder="Enter description..."
          variant="outlined"
        />
        <div class="d-flex justify-end">
          <VBtn @click="hide" :disabled="showLoader" variant="text">
            Cancel
          </VBtn>
          <VBtn
            :loading="showLoader"
            type="submit"
            color="primary-darken-4"
            variant="text"
            class="px-1"
          >
            Create
          </VBtn>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import { array, object, string } from 'yup';
import pMinDelay from 'p-min-delay';
import { repository as api } from '@/api';
import RepositoryNameField from '@/components/common/RepositoryNameField.vue';
import { SCHEMAS } from 'tailor-config-shared';
import TailorDialog from '@/components/common/TailorDialog.vue';
import { useRepositoryStore } from '@/stores/repository';

defineProps<{ isAdmin: boolean }>();
const emit = defineEmits(['done']);

const NEW_TAB = 'schema';
const IMPORT_TAB = 'import';

const store = useRepositoryStore();
const selectedTab = ref(NEW_TAB);
const isCreate = computed(() => selectedTab.value === NEW_TAB);
const isVisible = ref(false);
const showLoader = ref(false);
const serverError = ref('');
const archive = ref();

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: object({
    schema: string().when(([], schema) => {
      return selectedTab.value === NEW_TAB
        ? schema.required()
        : schema.notRequired();
    }),
    name: string().required().min(2).max(2000),
    description: string().required().min(2).max(2000),
    archive: array().when(([], schema) => {
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
  await store.create(formPayload);
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
};
</script>

<style lang="scss" scoped>
::v-deep .v-list.v-sheet {
  text-align: left;
}
</style>
