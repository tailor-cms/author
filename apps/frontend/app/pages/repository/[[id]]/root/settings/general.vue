<template>
  <div class="pa-8 text-left">
    <div class="actions d-flex justify-end">
      <VBtn
        :loading="isPublishing"
        color="primary-darken-2"
        size="small"
        variant="tonal"
        @click="publish"
      >
        <VIcon class="mr-2">mdi-cloud-upload-outline</VIcon>
        Publish info
      </VBtn>
    </div>
    <RepositoryNameField
      :key="`name.${$pluginRegistry.dataVersion}`"
      :value="nameValue"
      :repository-id="repository?.id"
      :entity-data="entityData"
      class="meta-input"
      @change="(val) => updateMeta('name', val)"
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
      @update="updateMeta"
    />
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep, find } from 'lodash-es';
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';
import type { Repository } from '@tailor-cms/interfaces/repository';

import { repository as api } from '@/api';
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

const isPublishing = ref(false);

const repository = computed(
  () => currentRepositoryStore.repository as Repository,
);
const metadata = computed(() =>
  $schemaService.getRepositoryMetadata(repository.value),
);

// Construct entity data for plugin hooks
// Name/description at root level, other data spread from repository.data
const entityData = computed(() => {
  const repo = repository.value;
  if (!repo) return {};
  return {
    name: repo.name,
    description: repo.description,
    ...repo.data,
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
  isPublishing.value = true;
  await api.publishRepositoryMeta(repository.value?.id);
  isPublishing.value = false;
  notify('Info successfully published', { immediate: true });
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
