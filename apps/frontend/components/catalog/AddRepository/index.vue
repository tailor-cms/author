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
        color="secondary"
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
      <Form
        class="pa-4 bg-primary-lighten-5"
        novalidate
        @submit="createRepository"
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
            <Field
              v-slot="{ field, errors, value }"
              v-model="repository.schema"
              :rules="{ required: isCreate }"
              name="schema"
            >
              <VSelect
                v-bind="field"
                :error-messages="errors"
                :items="availableSchemas"
                :menu-props="{ attach: '#addDialogWindow' }"
                :model-value="value"
                data-testid="type-input"
                item-title="name"
                item-value="id"
                label="Type"
                placeholder="Select type..."
                variant="outlined"
              />
            </Field>
          </VWindowItem>
          <VWindowItem :value="IMPORT_TAB" class="pt-1">
            <Field
              v-slot="{ handleBlur, handleChange, errors }"
              :rules="{ required: !isCreate }"
              name="archive"
            >
              <VFileInput
                v-model="archive"
                :clearable="false"
                :error-messages="errors"
                :label="archive ? 'Selected archive' : 'Select archive'"
                accept=".tgz"
                class="mb-2"
                name="archive"
                prepend-icon=""
                prepend-inner-icon="mdi-paperclip"
                variant="outlined"
                @blur="handleBlur"
                @change="handleChange"
              />
            </Field>
          </VWindowItem>
        </VWindow>
        <div class="dialog-subcontainer">
          <Field
            v-slot="{ field, value, errors }"
            v-model="repository.name"
            name="name"
            rules="required|min:2|max:25"
          >
            <RepositoryNameField
              v-bind="field"
              :error-messages="errors"
              :model-value="value"
              class="mb-2"
              name="name"
              placeholder="Enter name..."
            />
          </Field>
          <Field
            v-slot="{ field, value, errors }"
            v-model="repository.description"
            name="description"
            rules="required|min:2|max:2000"
          >
            <VTextarea
              v-bind="field"
              :error-messages="errors"
              :model-value="value"
              label="Description"
              placeholder="Enter description..."
              variant="outlined"
            />
          </Field>
          <AIAssistance
            v-if="runtimeConfig.public.aiUiEnabled && selectedTab === NEW_TAB"
            :description="repository.description"
            :name="repository.name"
            :schema-id="repository.schema"
            @structure="aiSuggestedOutline = $event"
          />
          <template v-if="isCreate">
            <MetaInput
              v-for="it in schemaMeta"
              :key="it.key"
              :meta="it"
              class="meta-input"
              @update="(key, value) => (repository.data[key] = value)"
            />
          </template>
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
      </Form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { Field, Form } from 'vee-validate';
import pMinDelay from 'p-min-delay';
import { SCHEMAS } from 'tailor-config-shared';

import AIAssistance from './AIAssistance.vue';
import { repository as api } from '@/api';
import MetaInput from '@/components/common/MetaInput.vue';
import RepositoryNameField from '@/components/common/RepositoryNameField.vue';
import TailorDialog from '@/components/common/TailorDialog.vue';
import { useActivityStore } from '@/stores/activity';
import { useRepositoryStore } from '@/stores/repository';

const resetData = () => ({
  schema: SCHEMAS[0].id,
  name: 'hjbjhb',
  description: '',
  data: {},
});

const { $schemaService } = useNuxtApp() as any;

const runtimeConfig = useRuntimeConfig();
const repositoryStore = useRepositoryStore();
const activityStore = useActivityStore();

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

const repository = reactive(resetData());
const archive = ref(null);

const schema = computed(() =>
  SCHEMAS.find((it) => it.id === repository.schema),
);

const schemaMeta = computed(() =>
  schema.value?.meta.filter((it) => !it.hideOnCreate),
);

const availableSchemas = computed(() => {
  const availableSchemas = (runtimeConfig.public.availableSchemas || '')
    .split(',')
    .filter(Boolean)
    .map((schema) => schema.trim());
  if (!availableSchemas.length) return SCHEMAS;
  return SCHEMAS.filter((it) => availableSchemas.includes(it.id));
});

const createRepository = async () => {
  isSubmitting.value = true;
  const action = isCreate.value ? create : importRepository;
  try {
    await pMinDelay(action(repository), 2000);
    emit('created');
    hide();
  } catch {
    serverError.value = 'An error has occurred!';
  }
};

const create = async (formPayload: {
  schema: string;
  name: string;
  description: string;
  data: any;
}) => {
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
  const outlineLevels = $schemaService.getOutlineLevels(repository.schema);
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

const importRepository = async ({ name, description }: any) => {
  if (!archive.value) return;
  try {
    const form = new FormData();
    form.append('archive', archive.value);
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
  resetData();
};
</script>

<style lang="scss" scoped>
.v-alert :deep(.mdi-close) {
  color: #eee;
}

.dialog-subcontainer {
  min-height: 21.5rem;
}
</style>
