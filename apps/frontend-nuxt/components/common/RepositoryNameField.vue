<template>
  <VTextField
    @change="update"
    v-model.trim="nameInput"
    v-bind="$attrs"
    :error-messages="errors.name"
    :label="props.label"
    :messages="warning"
    variant="outlined"
    class="required"
  >
    <template #message="{ message }">
      <div v-if="warning" class="d-flex align-center">
        <VIcon color="warning" class="mr-1 text-body-1">mdi-alert</VIcon>
        <span class="warning--text">{{ message }}</span>
      </div>
      <template v-else>{{ message }}</template>
    </template>
  </VTextField>
</template>

<script lang="ts" setup>
import api from '@/api/repository';
import { debounce } from 'lodash';
import { useForm } from 'vee-validate';
import { object, string } from 'yup';

const EXISTING_NAME_MSG = 'Warning: a Repository with that name already exists.';

const props = defineProps({
  value: { type: String, default: '' },
  label: { type: String, default: 'Name' },
  repositoryId: { type: Number, default: null }
});
const emit = defineEmits(['change']);

const existingRepoNames = ref([]);
const warning = ref('');

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: object({
    internalValue: string().required().min(2).max(250)
  })
});
const [nameInput] = defineField('name');
nameInput.value = props.value;

const update = handleSubmit(() => {
  if (errors?.name) return;
  emit('change', nameInput.value);
});

watch(nameInput, debounce((val) => {
  const isDuplicate = existingRepoNames.value.some(repo => repo.name === val);
  warning.value = isDuplicate ? EXISTING_NAME_MSG : '';
}, 200));

onMounted(async () => {
  const params = props.repositoryId ? { repositoryId: props.repositoryId } : {};
  existingRepoNames.value = await api.getRepositories(params);
});
</script>
