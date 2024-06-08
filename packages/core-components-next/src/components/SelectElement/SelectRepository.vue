<template>
  <VCombobox
    :items="repositories"
    :loading="loading"
    :model-value="repository"
    class="mx-3"
    item-title="name"
    item-value="id"
    label="Select repository"
    placeholder="Type to search repositories..."
    variant="outlined"
    return-object
    @update:model-value="selectRepository"
    @update:search="fetchRepositories"
  />
</template>

<script lang="ts" setup>
import { inject, onMounted, ref } from 'vue';
import debounce from 'lodash/debounce';
import find from 'lodash/find';
import sortBy from 'lodash/sortBy';

import loader from '../../loader';

defineProps<{ repository: any }>();
const emit = defineEmits(['selected']);

const repositories = ref([]);
const loading = ref(false);

const api = inject('$api');

const selectRepository = (repository) => {
  if (find(repositories.value, { id: repository.id })) {
    emit('selected', repository);
  }
};

const fetchRepositories = debounce(
  loader(async (search) => {
    const fetchedRepositories = await api.fetchRepositories({ search });
    repositories.value = sortBy(fetchedRepositories.items, 'name');
  }, 'loading'),
  500,
);

onMounted(() => fetchRepositories());
</script>
