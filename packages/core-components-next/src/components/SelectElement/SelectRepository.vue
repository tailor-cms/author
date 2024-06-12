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

const repositories = ref<Repository[]>([]);
const { loading, loader } = useLoader();

const api = inject<any>('$api');

const selectRepository = (repository: Repository) => {
  if (find(repositories.value, { id: repository?.id })) {
    emit('selected', repository);
  }
};

const fetchRepositories = debounce(
  loader(async (search: string) => {
    const fetchedRepositories: { items: Repository[]; total: number } =
      await api.fetchRepositories({ search });
    repositories.value = sortBy(fetchedRepositories.items, 'name');
  }),
  500,
);

onMounted(() => fetchRepositories());
</script>
