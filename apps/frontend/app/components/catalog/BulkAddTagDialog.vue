<template>
  <TailorDialog
    :model-value="isVisible"
    header-icon="mdi-tag-outline"
    title="Add tag to selection"
    @close="close"
    @submit="submitForm"
  >
    <template #body>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Add a tag to {{ count }} selected
        {{ count === 1 ? 'repository' : 'repositories' }}.
      </p>
      <VCombobox
        v-model="tagInput"
        :error-messages="errors.tag"
        :items="availableTags"
        label="Select a tag or add a new one"
        name="tag"
        variant="outlined"
        @keydown.enter="submitForm"
      />
    </template>
    <template #actions>
      <VBtn text="Cancel" variant="text" @click="close" />
      <VBtn
        :loading="isSaving"
        color="primary"
        type="submit"
        text="Save"
        variant="flat"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { map } from 'lodash-es';
import { object, string } from 'yup';
import type { Tag } from '@tailor-cms/interfaces/repository';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';

import { api } from '@/api';

const props = defineProps<{ isVisible: boolean; count: number }>();
const emit = defineEmits<{ close: []; add: [tag: string] }>();

const tags = ref<Tag[]>([]);
const isSaving = ref(false);
const availableTags = computed(() => map(tags.value, 'name'));

const { defineField, handleSubmit, errors, resetForm } = useForm({
  validationSchema: object({
    tag: string()
      .trim()
      .required()
      .matches(/^[a-zA-Z0-9\s]+$/, {
        message: 'Tag can contain only letters, numbers, and spaces',
      })
      .min(2)
      .max(20),
  }),
});
const [tagInput] = defineField('tag');

const close = () => {
  resetForm();
  emit('close');
};

const submitForm = handleSubmit(async () => {
  isSaving.value = true;
  try {
    emit('add', tagInput.value);
  } finally {
    isSaving.value = false;
  }
  close();
});

watch(
  () => props.isVisible,
  (isVisible) => {
    if (!isVisible) return;
    api.tag.list().then((fetched) => (tags.value = fetched));
  },
);
</script>
