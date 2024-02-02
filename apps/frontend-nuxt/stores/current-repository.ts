import { useActivityStore } from './activity';
import { useRepositoryStore } from './repository';

export const useCurrentRepository = defineStore('currentRepository', () => {
  const route = useRoute();
  const Repository = useRepositoryStore();
  const Activity = useActivityStore();

  const repositoryId = computed(() => Number(route.params.id));
  const repository = computed(() => Repository.findById(repositoryId.value));
  const activities = computed(() =>
    Activity.where((it) => it.repositoryId === repositoryId.value),
  );

  const initialize = async () => {
    await Repository.get(repositoryId.value);
    await Activity.fetch(repositoryId.value);
  };

  return {
    initialize,
    repositoryId,
    repository,
    activities,
  };
});
