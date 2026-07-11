<template>
  <TailorDialog
    :model-value="show"
    :title="`Clone ${target?.name}`"
    header-icon="mdi-content-copy"
    persistent
    @submit="submit"
  >
    <template #body>
      <VTextField
        v-model="nameInput"
        :disabled="inProgress"
        :error-messages="errors.name"
        class="required mb-4"
        label="Name"
        placeholder="Enter name..."
        variant="outlined"
      />
      <VTextarea
        v-model="descriptionInput"
        :disabled="inProgress"
        :error-messages="errors.description"
        class="required mb-4"
        label="Description"
        placeholder="Enter description..."
        variant="outlined"
      />
    </template>
    <template #actions>
      <VBtn
        :disabled="inProgress"
        text="Cancel"
        variant="text"
        @click="close"
      />
      <VBtn
        :loading="inProgress"
        color="primary"
        type="submit"
        text="Clone"
        variant="flat"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { Repository } from '@tailor-cms/interfaces/repository';

import { object, string } from 'yup';
import { schema as schemaApi } from '@tailor-cms/config';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';

import { useCurrentRepository } from '@/stores/current-repository';
import { useRepositoryStore } from '@/stores/repository';

const props = withDefaults(
  defineProps<{ show?: boolean; repository?: Repository }>(),
  { show: true },
);

const emit = defineEmits(['close', 'cloned']);

const notify = useNotification();

const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();

const inProgress = ref(false);

// Prefer an explicitly passed repository (e.g. from the catalog); fall back
// to the loaded repository when used within the repository context.
const target = computed(
  () => props.repository ?? currentRepositoryStore?.repository,
);

const repositoryTypeLabel = computed(
  () => schemaApi.getSchema(target.value!.schema).name,
);

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    name: string().required().min(2).max(250),
    description: string().required().min(2).max(2000),
  }),
});
const [nameInput] = defineField('name');
const [descriptionInput] = defineField('description');

const close = () => {
  emit('close');
  resetForm();
};

const submit = handleSubmit(async () => {
  inProgress.value = true;
  try {
    const { id } = target.value!;
    await repositoryStore.clone(id, nameInput.value, descriptionInput.value);
    notify(`The ${repositoryTypeLabel.value.toLowerCase()} has been cloned`, {
      immediate: true,
    });
    emit('cloned');
    close();
  } catch {
    notify(`We couldn't clone the ${repositoryTypeLabel.value.toLowerCase()}`, {
      color: 'error',
    });
  } finally {
    inProgress.value = false;
  }
});
</script>
