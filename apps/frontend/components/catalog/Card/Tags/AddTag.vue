<template>
  <TailorDialog
    :model-value="isVisible"
    header-icon="mdi-tag-outline"
    @close="closeAddTagDialog"
  >
    <template #header>Add Tag</template>
    <template #body>
      <form novalidate @submit.prevent="submitForm">
        <VCombobox
          v-model="tagInput"
          :error-messages="errors.tag"
          :items="availableTags"
          label="Select a tag or add a new one"
          name="tag"
          variant="outlined"
          @keydown.enter="submitForm"
          @update-tag-name:search-input="(v: string) => (tagInput = v)"
        />
        <div class="d-flex justify-end pb-2 pr-1">
          <VBtn
            class="mr-2"
            color="primary-darken-4"
            variant="text"
            @click="closeAddTagDialog"
          >
            Cancel
          </VBtn>
          <VBtn color="primary-darken-2" type="submit" variant="tonal">
            Save
          </VBtn>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import type { Repository, Tag } from '@tailor-cms/interfaces/repository';
import differenceBy from 'lodash/differenceBy';
import map from 'lodash/map';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';

import { tag as api } from '@/api';
import { useRepositoryStore } from '@/stores/repository';

const store = useRepositoryStore();

const props = defineProps<{ repository: Repository; isVisible: boolean }>();
const emit = defineEmits(['close']);

const tags = ref<Tag[]>([]);
const assignedTags = computed(() => props.repository.tags);
const availableTags = computed(() =>
  map(differenceBy(tags.value, assignedTags.value, 'id'), 'name'),
);

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: object({
    tag: string().required().min(2).max(20),
  }),
});
const [tagInput] = defineField('tag');

const closeAddTagDialog = () => {
  tagInput.value = null;
  emit('close');
};

const submitForm = handleSubmit(async () => {
  await store.addTag(props.repository.id, tagInput.value);
  closeAddTagDialog();
});

watch(
  () => props.isVisible,
  (isVisible) => {
    if (!isVisible) return;
    api.fetch().then((fetchedTags) => (tags.value = fetchedTags));
  },
);
</script>
