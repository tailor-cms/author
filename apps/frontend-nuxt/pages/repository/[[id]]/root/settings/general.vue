<template>
  <VSheet class="settings" color="primary-lighten-5" rounded="lg">
    <div class="actions">
      <VBtn
        @click="publish"
        :loading="isPublishing"
        class="float-right"
        color="teal-accent-4"
        size="small"
        variant="tonal"
      >
        <VIcon class="mr-2">mdi-cloud-upload-outline</VIcon>
        Publish info
      </VBtn>
    </div>
    <RepositoryNameField
      v-model="repository.name"
      :repository-id="repositoryId"
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
  </VSheet>
</template>

<script lang="ts" setup>
import { repository as api } from '@/api';
import cloneDeep from 'lodash/cloneDeep';
import find from 'lodash/find';
import MetaInput from '@/components/common/MetaInput.vue';
import RepositoryNameField from '@/components/common/RepositoryNameField.vue';
import set from 'lodash/set';
import { useCurrentRepository } from '@/stores/current-repository';
import { useRepositoryStore } from '@/stores/repository';
import { useNotification } from '@/composables/useNotification';

definePageMeta({
  name: 'repository-settings-general',
});

const { $schemaService } = useNuxtApp() as any;
const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();
const notify = useNotification();

const isPublishing = ref(false);

const repository = computed(() => currentRepositoryStore.repository);
const metadata = computed(() =>
  $schemaService.getRepositoryMetadata(repository.value),
);

const descriptionMeta = computed(() => ({
  key: 'description',
  value: repository.value?.description,
  type: 'TEXTAREA',
  label: 'Description',
  validate: { required: true, min: 2, max: 2000 },
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

  .btn {
    padding: 0.5rem 0.75rem;
  }
}
</style>
