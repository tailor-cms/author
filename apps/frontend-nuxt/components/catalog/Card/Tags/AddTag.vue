<template>
  <TailorDialog
    :model-value="true"
    header-icon="mdi-tag-outline"
    @click:outside="hide"
  >
    <template #header>Add Tag</template>
    <template #body>
      <form novalidate @submit.prevent="submitForm">
        <VCombobox
          v-model="tagInput"
          :error-messages="errors.tag"
          :items="availableTags"
          class="required"
          label="Select a tag or add a new one"
          name="tag"
          variant="outlined"
          @keydown.enter="submitForm"
          @update-tag-name:search-input="(v: string) => (tagInput = v)"
        />
        <div class="d-flex justify-end">
          <VBtn variant="text" @click="hide">Cancel</VBtn>
          <VBtn color="primary-darken-4" type="submit" variant="text">
            Save
          </VBtn>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import differenceBy from 'lodash/differenceBy';
import map from 'lodash/map';
import { useForm } from 'vee-validate';

import type { Repository, Tag } from '@/api/interfaces/repository';
import { tag as api } from '@/api';
import TailorDialog from '@/components/common/TailorDialog.vue';
import { useRepositoryStore } from '@/stores/repository';

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
