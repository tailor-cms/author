<template>
  <div class="pa-8 text-left">
    <div class="actions">
      <VBtn
        :loading="isPublishing"
        class="float-right"
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
      :repository-id="repository.id"
      :value="repository.name"
      class="my-2"
      @change="updateKey('name', $event)"
    />
    <MetaInput
      :key="descriptionMeta.key"
      :meta="descriptionMeta"
      class="meta-input"
      @update="updateKey"
    />
    <MetaInput
      v-for="it in metadata"
      :key="it.key"
      :meta="it"
      class="meta-input"
      @update="updateKey"
    />
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep, find, set } from 'lodash-es';
import type { Metadata } from '@tailor-cms/interfaces/schema';
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

const { $schemaService } = useNuxtApp() as any;

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

const descriptionMeta = computed<Metadata>(() => ({
  key: 'description',
  type: 'TEXTAREA',
  label: 'Description',
  value: repository.value?.description,
  validate: { required: true, min: 2, max: 2000 },
  rows: 2,
}));

const updateKey = async (key: string, value: any) => {
  if (find(metadata.value, { key })) key = `data.${key}`;
  const data: any = cloneDeep(repository.value);
  set(data, key, value);
  await repositoryStore.update(data);
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
