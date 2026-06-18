<template>
  <TailorDialog
    :model-value="show"
    :title="`Clone ${currentRepositoryStore?.repository?.name}`"
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
import { object, string } from 'yup';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';

import { useCurrentRepository } from '@/stores/current-repository';
import { useRepositoryStore } from '@/stores/repository';

withDefaults(defineProps<{ show?: boolean }>(), {
  show: true,
});
const emit = defineEmits(['close']);

const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();
const inProgress = ref(false);

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
  const { id } = currentRepositoryStore?.repository || {};
  if (id) {
    await repositoryStore.clone(id, nameInput.value, descriptionInput.value);
  }
  close();
});
</script>
