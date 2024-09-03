<template>
  <VTextField
    v-model="nameInput"
    v-bind="$attrs"
    :error-messages="errors"
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
import debounce from 'lodash/debounce';
import type { Repository } from '@tailor-cms/interfaces/repository';
import { string } from 'yup';
import { useField } from 'vee-validate';

import api from '@/api/repository';

const EXISTING_NAME_MSG =
  'Warning: a Repository with that name already exists.';

interface Props {
  value?: string;
  label?: string;
  repositoryId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  label: 'Name',
  repositoryId: null,
});
const emit = defineEmits(['change']);

const existingRepositories = ref<Repository[]>([]);
const warning = ref('');

const {
  value: nameInput,
  errors,
  validate,
} = useField('name', string().required().min(2).max(250), {
  initialValue: props.value,
});

const update = async () => {
  const { valid } = await validate();
  if (valid) emit('change', nameInput.value);
};

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
});
</script>
