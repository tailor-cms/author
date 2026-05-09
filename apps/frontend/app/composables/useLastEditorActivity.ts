import { useLocalStorage } from '@vueuse/core';

const STORAGE_KEY = 'tailor-cms-last-editor-activity';
const store = useLocalStorage<Record<string, number>>(STORAGE_KEY, {});

export const useLastEditorActivity = () => {
  const get = (repositoryId: number | null | undefined): number | null => {
    if (!repositoryId) return null;
    return store.value[String(repositoryId)] ?? null;
  };

  const set = (repositoryId: number, activityId: number) => {
    store.value = { ...store.value, [String(repositoryId)]: activityId };
  };

  return { get, set, store };
};
