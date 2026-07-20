<template>
  <VLayout class="general-page h-100">
    <VMain>
      <VContainer class="px-md-10 py-md-8 text-left" max-width="1400">
        <div class="d-flex align-center mb-4">
          <VSpacer />
          <VBtn
            :color="showSuccess ? 'success' : 'tertiary'"
            :loading="isPublishing"
            :prepend-icon="
              showSuccess ? 'mdi-check-circle-outline' : 'mdi-cloud-upload-outline'
            "
            :text="showSuccess ? 'Published' : 'Publish info'"
            min-width="140"
            variant="flat"
            @click="publish"
          />
        </div>
        <RepositoryNameField
          :key="`name.${$pluginRegistry.dataVersion}`"
          :value="nameValue"
          :entity-data="entityData"
          :repository-id="repository?.id"
          class="meta-input"
          @change="updateMeta"
        />
        <MetaInput
          :key="`description.${$pluginRegistry.dataVersion}`"
          :meta="descriptionMeta"
          :entity-data="entityData"
          class="meta-input"
          @update="updateMeta"
        />
        <MetaInput
          v-for="it in metadata"
          :key="`${it.key}.${$pluginRegistry.dataVersion}`"
          :meta="it"
          :entity-data="entityData"
          class="meta-input"
          dark
          @update="updateMeta"
        />
      </VContainer>
    </VMain>
  </VLayout>
</template>

<script lang="ts" setup>
import type { Metadata } from '@tailor-cms/interfaces/schema';
import type { Repository } from '@tailor-cms/interfaces/repository';
import { cloneDeep, find } from 'lodash-es';
import { refAutoReset } from '@vueuse/core';
import { useForm } from 'vee-validate';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';
import pMinDelay from 'p-min-delay';

import { api } from '@/api';
import MetaInput from '@/components/common/MetaInput.vue';
import RepositoryNameField from '@/components/common/RepositoryNameField.vue';
import { useCurrentRepository } from '@/stores/current-repository';
import { useNotification } from '@/composables/useNotification';
import { useRepositoryStore } from '@/stores/repository';

definePageMeta({
  name: 'repository-settings-general',
});

const { $schemaService, $pluginRegistry } = useNuxtApp() as any;

const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();
const storageService = useStorageService();

provide('$storageService', storageService);

const notify = useNotification();

const { errors } = useForm();

const MIN_PUBLISH_MS = 2000;
const isPublishing = ref(false);
// Briefly flash a success check on the Publish
const showSuccess = refAutoReset(false, 2000);

const repository = computed(
  () => currentRepositoryStore.repository as Repository,
);

const metadata = computed(() =>
  $schemaService.getRepositoryMetadata(repository.value),
);

// Gate publish on this page's own fields only. Plugin-injected fields (e.g.
// i18n's *_i18n) also register in the form but are empty for untranslated
// languages - a valid state that must not block publishing.
const ownFieldKeys = computed(() => [
  'name',
  'description',
  ...metadata.value.map((it: Metadata) => it.key),
]);
const hasBlockingErrors = computed(() =>
  ownFieldKeys.value.some((key) => errors.value[key]),
);

// Construct entity data for plugin hooks
// Name/description at root level, other data spread from repository.data
type EntityData = {
  name?: string;
  description?: string;
  [key: string]: unknown;
};
const entityData = computed<EntityData>(() => {
  const repo = repository.value;
  if (!repo) return {};
  return {
    ...repo.data,
    name: repo.name,
    description: repo.description,
  };
});

// Get processed name value via plugin hooks
const nameValue = computed(() => {
  const data = entityData.value;
  if (!data) return repository.value?.name ?? '';
  const rawValue = data.name ?? '';
  return $pluginRegistry.filter('data:value', rawValue, { data, key: 'name' });
});

const descriptionMeta = computed<Metadata>(() => ({
  key: 'description',
  type: MetaInputType.Textarea,
  label: 'Description',
  value: repository.value?.description,
  validate: { required: true, min: 2, max: 2000 },
  rows: 2,
}));

const updateMeta = async (
  key: string,
  value: any,
  updatedData?: Record<string, any>,
) => {
  const repoData: any = cloneDeep(repository.value);
  const isRootField = ['name', 'description'].includes(key);

  // Run transform hook if updatedData not provided
  if (isRootField && !updatedData) {
    updatedData = $pluginRegistry.transform('data:update', entityData.value, {
      key,
      value,
    });
  }

  if (isRootField) {
    // Name/description stored at root level, plugin data in repository.data
    repoData[key] = updatedData?.[key] ?? value;
    if (updatedData) {
      // Copy plugin-specific data to repository.data
      Object.keys(updatedData).forEach((k) => {
        if (!['name', 'description'].includes(k)) {
          repoData.data = { ...repoData.data, [k]: updatedData[k] };
        }
      });
    }
  } else if (find(metadata.value, { key })) {
    // Schema metadata stored in data object
    repoData.data = updatedData ?? { ...repoData.data, [key]: value };
  }

  await repositoryStore.update(repoData);
  notify('Saved', { immediate: true });
};

const publish = async () => {
  if (hasBlockingErrors.value) {
    notify('Please fix the highlighted errors before publishing', {
      color: 'error',
      immediate: true,
    });
    return;
  }
  isPublishing.value = true;
  try {
    // Hold the spinner a minimum time so fast publishes don't just flicker.
    await pMinDelay(
      api.repository.publishMeta({
        params: { repositoryId: repository.value!.id },
      }),
      MIN_PUBLISH_MS,
    );
    notify('Info successfully published', { immediate: true });
    showSuccess.value = true;
  } catch {
    notify('We couldn\'t publish the info', { color: 'error' });
  } finally {
    isPublishing.value = false;
  }
};
</script>

<style lang="scss" scoped>
.settings {
  padding: 1.875rem;
  text-align: left;

  .meta-input {
    margin: 1.25rem 0;
  }
}

.actions {
  min-height: 2.25rem;
  margin-bottom: 1.25rem;
}
</style>
