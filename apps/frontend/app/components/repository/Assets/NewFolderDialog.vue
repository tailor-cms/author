<template>
  <TailorDialog
    v-model="show"
    header-icon="mdi-folder-plus-outline"
    title="New folder"
    width="420"
    @close="show = false"
    @submit="submit"
  >
    <template #body>
      <VTextField
        v-model="name"
        :error-messages="errors.name"
        :hint="hint"
        hide-details="auto"
        label="Folder name"
        name="name"
        placeholder="e.g. Diagrams"
        prepend-inner-icon="mdi-folder-outline"
        variant="outlined"
        persistent-hint
        @keydown.enter="submit"
      />
    </template>
    <template #actions>
      <VBtn text="Cancel" variant="text" @click="show = false" />
      <VBtn color="primary" text="Create" type="submit" variant="flat" />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';

const MAX_NAME_LENGTH = 30;

const props = defineProps<{
  parentPath: string;
  existingNames: string[];
}>();

const emit = defineEmits<{
  create: [name: string];
}>();

const show = defineModel<boolean>({ default: false });

const isDuplicate = (value?: string) => {
  const target = (value ?? '').trim().toLowerCase();
  return props.existingNames.some((it) => it.toLowerCase() === target);
};

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    name: string()
      .trim()
      .required('Enter a folder name')
      .max(MAX_NAME_LENGTH, 'Folder name is too long')
      .matches(/^[^/]+$/, 'Folder names cannot contain a slash')
      .notOneOf(['.', '..'], 'Enter a valid folder name')
      .test('unique', 'A folder with this name already exists', (value) =>
        !isDuplicate(value),
      ),
  }),
});
const [name] = defineField('name');

const hint = computed(() =>
  props.parentPath
    ? `Created inside "${props.parentPath}".`
    : 'Created in the library root.',
);

watch(show, (isOpen) => {
  if (isOpen) resetForm();
});

const submit = handleSubmit(({ name: value }) => {
  emit('create', value.trim());
  show.value = false;
});
</script>
