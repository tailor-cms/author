import { useRepositoryStore } from './repository';

export const useCurrentRepository = defineStore('currentRepository', () => {
  const route = useRoute();
  const Repository = useRepositoryStore();

  const repositoryId = computed(() => Number(route.params.id));
  const repository = computed(() => Repository.findById(repositoryId.value));

  const initialize = async () => {
    await Repository.get(repositoryId.value);
  };

  return {
    repositoryId,
    repository,
    initialize,
  };
});
