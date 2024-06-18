<template>
  <VAutocomplete
    :items="repositories"
    :loading="loading"
    :model-value="repository"
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

import type { Repository } from '../../interfaces/repository';
import { useLoader } from '../../composables/useLoader';

defineProps<{ repository?: Repository }>();
const emit = defineEmits(['selected']);

const api = inject<any>('$api');

const { loading, loader } = useLoader();

const repositories = ref<Repository[]>([]);

const selectRepository = (repository: Repository) => {
  if (find(repositories.value, { id: repository.id })) {
    emit('selected', repository);
  }
};

const fetchRepositories = debounce(
  loader(async (search: string) => {
    const data = await api.fetchRepositories({ search });
    const fetchedRepositories: Repository[] = data.items;
    repositories.value = sortBy(fetchedRepositories, 'name');
  }),
  500,
);

onMounted(() => fetchRepositories());
</script>
