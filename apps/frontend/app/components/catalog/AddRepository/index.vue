<template>
  <TailorDialog
    v-if="authStore.hasCreateRepositoryAccess"
    v-model="isVisible"
    header-icon="mdi-folder-plus-outline"
    title="Create"
    width="600"
    persistent
    scrollable
    @submit="createRepository"
  >
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        aria-label="Add repository"
        class="add-repository-btn"
        color="primary"
        prepend-icon="mdi-plus"
        size="large"
        text="New"
        variant="flat"
      />
    </template>
    <template #subheader>
      <div class="px-5 pb-4">
        <VTabs
          v-model="selectedTab"
          selected-class="bg-surface-container-high on-surface"
          grow
          hide-slider
        >
          <VTab
            :value="NEW_TAB"
            aria-label="New repository"
            class="mr-2"
            text="New"
          />
          <VTab
            :value="IMPORT_TAB"
            aria-label="Import repository"
            class="ml-2"
            text="Import"
          />
        </VTabs>
      </div>
    </template>
    <template #body>
      <VAlert
        :model-value="!!serverError"
        :text="serverError"
        class="mt-3 mb-5"
        icon="mdi-alert"
        type="error"
        variant="tonal"
        closable
        @click:close="serverError = ''"
      />
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
          >
            <template #item="{ item, props: itemProps }">
              <VListItem
                v-bind="itemProps"
                :subtitle="item.description"
                class="py-4"
              />
            </template>
          </VSelect>
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
          :class="{ required: isCreate }"
          :error-messages="errors.description"
          :placeholder="
            isCreate ? 'Enter description...' : 'Leave blank to inherit from the archive'
          "
          label="Description"
          variant="outlined"
        />
        <template v-if="isCreate">
          <MetaInput
            v-for="it in schemaMeta"
            :key="it.key"
            :meta="it"
            class="meta-input"
            is-new
          />
        </template>
        <VSelect
          v-show="showUserGroupInput"
          v-model="groupInput"
          :error-messages="errors.userGroupIds"
          :items="authStore.groupsWithCreateRepositoryAccess"
          class="user-group-select mb-3"
          item-title="name"
          item-value="id"
          label="User Group"
          placeholder="Select user group..."
          variant="outlined"
          hide-details
          chips
          clearable
          closable-chips
          multiple
        />
      </div>
    </template>
    <template #actions>
      <VBtn
        :disabled="isSubmitting"
        text="Cancel"
        variant="text"
        @click="hide"
      />
      <VBtn
        :loading="isSubmitting"
        color="primary"
        text="Create"
        type="submit"
        variant="flat"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { ActivityConfig } from '@tailor-cms/interfaces/schema';
import { formDataBodySerializer } from '@tailor-cms/api-client';
import { pick, startCase } from 'lodash-es';
import pMinDelay from 'p-min-delay';
import { SCHEMAS } from '@tailor-cms/config';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';

import { api } from '@/api';
import MetaInput from '@/components/common/MetaInput.vue';
import RepositoryNameField from '@/components/common/RepositoryNameField.vue';

const authStore = useAuthStore();
const repositoryStore = useRepositoryStore();
const config = useConfigStore();

const NEW_TAB = 'schema';
const IMPORT_TAB = 'import';

defineProps<{ isCreateEnabled: boolean }>();

const emit = defineEmits(['created']);

const isVisible = ref(false);
const selectedTab = ref(NEW_TAB);
const isCreate = computed(() => selectedTab.value === NEW_TAB);
const isSubmitting = ref(false);
const serverError = ref('');

const showUserGroupInput = computed(() => {
  if (authStore.hasDefaultUserGroup) return false;
  return !!authStore.groupsWithCreateRepositoryAccess?.length;
});

const metaValidation = reactive<Record<string, any>>({});

const { defineField, handleSubmit, resetForm, errors } = useForm({
  initialValues: {
    schema:
      config.availableSchemas.length === 1
        ? config.availableSchemas[0]!.id
        : null,
    name: '',
    description: '',
    archive: null,
    userGroupIds: [] as number[],
  },
  validationSchema: computed(() => ({
    schema: { required: selectedTab.value === NEW_TAB },
    // Name is always required - on the Import tab it's pre-filled from the
    // archive (see the archiveInput watch). Description stays optional on
    // Import: blank inherits the archive's own value via the backend fallback.
    name: 'required|min:2|max:250',
    description: isCreate.value ? 'required|min:2|max:2000' : 'min:2|max:2000',
    archive: { required: selectedTab.value === IMPORT_TAB },
    ...metaValidation,
  })),
});

const [schemaInput] = defineField('schema');
const [nameInput] = defineField('name');
const [descriptionInput] = defineField('description');
const [archiveInput] = defineField('archive');
const [groupInput] = defineField('userGroupIds');

const schema = computed<ActivityConfig>(
  () => SCHEMAS.find((it) => it.id === schemaInput.value) as any,
);

const schemaMeta = computed(() =>
  schema.value?.meta?.filter((it) => !it.hideOnCreate),
);

// Export names the download after the repository (see snakeCase(name) in
// export-download.action.ts) - best-effort reverse it into the Name field
// so the user isn't stuck retyping what's already in the filename.
watch(archiveInput, (archive) => {
  if (!archive || nameInput.value) return;
  nameInput.value = startCase(archive.name.replace(/\.tgz$/i, ''));
});

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
    ...pick(formData, ['schema', 'name', 'description', 'userGroupIds']),
    data: pick(formData, Object.keys(metaValidation)),
  };
  await repositoryStore.create(formPayload);
};

const importRepository = async ({
  archive,
  name,
  description,
  userGroupIds,
}: any) => {
  try {
    await api.repository.import({
      body: { archive, name, description, userGroupIds },
      ...formDataBodySerializer,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    Object.keys(metaValidation).forEach((key) => delete metaValidation[key]);
    if (!val?.length) return;
    return val.forEach((it) => (metaValidation[it.key] = it.validate));
  },
  { immediate: true },
);

watch(isVisible, (val) => {
  if (!val) return;
  groupInput.value = authStore.hasDefaultUserGroup
    ? [authStore.userGroups[0]!.id]
    : [];
});
</script>

<style lang="scss" scoped>
:deep(.v-list-item-subtitle) {
  margin: 0.25rem 0 0;
}

.dialog-subcontainer {
  min-height: 21.5rem;
}
</style>
