<template>
  <VTextField
    v-model="nameInput"
    v-bind="$attrs"
    :error-messages="errors.name"
    :label="props.label"
    :messages="warning"
    class="required"
    name="name"
    variant="outlined"
    @change="update"
  >
    <template #message="{ message }">
      <div v-if="warning" class="d-flex align-center">
        <VIcon class="mr-1 text-body-1" color="warning">mdi-alert</VIcon>
        <span class="warning--text">{{ message }}</span>
      </div>
      <template v-else>{{ message }}</template>
    </template>
  </VTextField>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import debounce from 'lodash/debounce';
import { useForm } from 'vee-validate';

import api from '@/api/repository';
import type { Repository } from '@/api/interfaces/repository';

const EXISTING_NAME_MSG =
  'Warning: a Repository with that name already exists.';

interface Props {
  value?: string;
  label?: string;
  repositoryId?: number | null;
  isValidated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  label: 'Name',
  repositoryId: null,
  isValidated: true,
});
const emit = defineEmits(['change']);

const existingRepositories = ref<Repository[]>([]);
const warning = ref('');

const { defineField, handleSubmit, errors, validate, resetForm } = useForm({
  validationSchema: object({
    name: string().required().min(2).max(250),
  }),
});
const [nameInput] = defineField('name');

const update = handleSubmit(() => {
  emit('change', nameInput.value);
});

watch(
  () => props.isValidated,
  (val) => (val ? validate() : resetForm()),
);
watch(
  nameInput,
  debounce((val) => {
    const isDuplicate = existingRepositories.value.some(
      (repo) => repo.name === val,
    );
    warning.value = isDuplicate ? EXISTING_NAME_MSG : '';
  }, 200),
);

onMounted(async () => {
  const params = props.repositoryId ? { repositoryId: props.repositoryId } : {};
  const { items: repositories } = await api.getRepositories(params);
  existingRepositories.value = repositories;
  nameInput.value = props.value;
  resetForm();
});
</script>
