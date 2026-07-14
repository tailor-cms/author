<template>
  <TailorDialog
    :model-value="show"
    :title="`Clone ${repositoryTypeLabel}`"
    header-icon="mdi-content-copy"
    persistent
    @submit="submit"
  >
    <template #body>
      <p class="text-body-medium text-medium-emphasis mb-5">
        You are about to clone the {{ repositoryTypeLabel }}
        "{{ target?.name }}". Name the copy and adjust its description as
        needed.
      </p>
      <VTextField
        v-model="nameInput"
        :counter="NAME_MAX_LENGTH"
        :disabled="inProgress"
        :error-messages="errors.name"
        class="required mb-4"
        label="Name"
        placeholder="Enter name..."
        variant="outlined"
      />
      <VTextarea
        v-model="descriptionInput"
        :counter="DESCRIPTION_MAX_LENGTH"
        :disabled="inProgress"
        :error-messages="errors.description"
        class="required"
        label="Description"
        placeholder="Enter description..."
        variant="outlined"
      />
      <VSwitch
        v-model="shareWithSamePeople"
        :disabled="inProgress || !hasPeopleToShareWith"
        class="ml-1 mb-1"
        label="Share with the same people"
        hide-details
      />
      <div class="share-hint text-body-small text-medium-emphasis ml-1 mb-3">
        {{ shareHint }}
      </div>
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

import { api } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useCurrentRepository } from '@/stores/current-repository';
import { useRepositoryStore } from '@/stores/repository';

const props = withDefaults(
  defineProps<{ show?: boolean; repository?: Repository }>(),
  { show: true },
);

const emit = defineEmits(['close', 'cloned']);

const NAME_MAX_LENGTH = 250;
const DESCRIPTION_MAX_LENGTH = 2000;

const notify = useNotification();

const authStore = useAuthStore();
const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();

const inProgress = ref(false);
const shareWithSamePeople = ref(false);
// Whether the source is shared with anyone besides the acting user;
const hasPeopleToShareWith = ref(false);
const isResolvingAccess = ref(true);

// Prefer an explicitly passed repository (e.g. from the catalog); fall back
// to the loaded repository when used within the repository context.
const target = computed(
  () => props.repository ?? currentRepositoryStore?.repository,
);

const repositoryTypeLabel = computed(() =>
  schemaApi.getLabel(target.value!),
);

const shareHint = computed(() => {
  const label = repositoryTypeLabel.value;
  if (isResolvingAccess.value) return 'Checking who has access...';
  return hasPeopleToShareWith.value
    ? `Users and user groups of the original ${label} can access the clone.`
    : `The original ${label} isn't shared with anyone else.`;
});

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    name: string().required().min(2).max(NAME_MAX_LENGTH),
    description: string().required().min(2).max(DESCRIPTION_MAX_LENGTH),
  }),
  // The copy usually keeps the original description; the name must be new.
  initialValues: {
    name: '',
    description: target.value?.description ?? '',
  },
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
    await repositoryStore.clone(
      id,
      nameInput.value,
      descriptionInput.value,
      shareWithSamePeople.value,
    );
    notify(`The ${repositoryTypeLabel.value} has been cloned`, {
      immediate: true,
    });
    emit('cloned');
    close();
  } catch {
    notify(`We couldn't clone the ${repositoryTypeLabel.value}`, {
      color: 'error',
    });
  } finally {
    inProgress.value = false;
  }
});

onMounted(async () => {
  const { id } = target.value!;
  try {
    const [source, members] = await Promise.all([
      target.value?.userGroups ? target.value : repositoryStore.get(id),
      api.repository.getUsers({ params: { repositoryId: id } }),
    ]);
    const hasCollaborators = members.some(
      (it) => it.id !== authStore.user?.id,
    );
    hasPeopleToShareWith.value =
      hasCollaborators || !!source.userGroups?.length;
  } finally {
    isResolvingAccess.value = false;
  }
});
</script>
