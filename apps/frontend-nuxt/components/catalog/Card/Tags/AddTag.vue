<template>
  <TailorDialog
    @click:outside="emit('close')"
    :model-value="true"
    header-icon="mdi-tag-outline"
  >
    <template #header>Add Tag</template>
    <template #body>
      <form @submit.prevent="submitForm" novalidate>
        <VCombobox
          v-model="tagInput"
          @updateTagName:search-input="(v: string) => (tagInput = v)"
          @keydown.enter="submitForm"
          :items="availableTags"
          :error-messages="errors.tag"
          name="tag"
          label="Select a tag or add a new one"
          variant="outlined"
          class="required"
        />
        <div class="d-flex justify-end">
          <VBtn @click="hide" variant="text">Cancel</VBtn>
          <VBtn type="submit" color="primary-darken-4" variant="text">
            Save
          </VBtn>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { Repository, Tag } from '@/api/interfaces/repository';

import { tag as api } from '@/api';
import differenceBy from 'lodash/differenceBy';
import map from 'lodash/map';
import TailorDialog from '@/components/common/TailorDialog.vue';
import { useForm } from 'vee-validate';
import { useRepositoryStore } from '@/stores/repository';
import { object, string } from 'yup';

const props = defineProps<{ repository: Repository }>();
const emit = defineEmits(['close']);

const store = useRepositoryStore();
const tags = ref<Tag[]>([]);

const hide = () => emit('close');

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

const submitForm = handleSubmit(async () => {
  await store.addTag(props.repository.id, tagInput.value);
  hide();
});

onMounted(() => {
  api.fetch().then((fetchedTags) => (tags.value = fetchedTags));
});
</script>

<style lang="scss" scoped>
::v-deep .v-list.v-sheet {
  text-align: left;
}
</style>
