import { computed } from 'vue';
import get from 'lodash/get';
import InsertLocation from '@/lib/InsertLocation';
import uniqBy from 'lodash/uniqBy';

import { useCurrentRepository } from '@/stores/current-repository';

export const useSelectedActivity = () => {
  const { $schemaService } = useNuxtApp() as any;
  const repoStore = useCurrentRepository();
  const activityStore = useActivityStore();

  const isEditable = computed(() => {
    if (!repoStore.selectedActivity) return false;
    return $schemaService.isEditable(repoStore.selectedActivity.type);
  });

  const parent = computed(() => {
    if (!repoStore.selectedActivity) return;
    const { parentId } = repoStore.selectedActivity;
    return repoStore.outlineActivities.find((it) => it.id === parentId);
  });

  const sameLevel = computed(() => {
    if (!repoStore.selectedActivity) return [];
    if (!parent.value)
      return repoStore.taxonomy.filter((it: any) => it.rootLevel);
    const { type } = parent.value;
    const parentConfig = repoStore.taxonomy.find((it: any) => it.type === type);
    const sameLevelTypes = get(parentConfig, 'subLevels', []);
    return repoStore.taxonomy.filter((it: any) =>
      sameLevelTypes.includes(it.type),
    );
  });

  const subLevels = computed(() => {
    if (!repoStore.selectedActivity) return [];
    const { type } = repoStore.selectedActivity;
    const config = repoStore.taxonomy.find((it: any) => it.type === type);
    const configuredSubLevels = get(config, 'subLevels', []);
    return repoStore.taxonomy.filter((it: any) =>
      configuredSubLevels.includes(it.type),
    );
  });

  const levels = computed(() =>
    uniqBy(sameLevel.value.concat(subLevels.value), 'type'),
  );

  const toggleOutlineItemExpand = (uid: string, expand: boolean) =>
    repoStore.toggleOutlineItemExpand(uid, expand);

  const expandOutlineItemParent = (item: any) => {
    const uid = activityStore.getParent(item.uid)?.uid;
    if (uid) repoStore.toggleOutlineItemExpand(uid, true);
  };

  const getAddDialogHeading = (action: string) => {
    const heading = {
      [InsertLocation.ADD_BEFORE]: 'Add above',
      [InsertLocation.ADD_AFTER]: 'Add below',
      [InsertLocation.ADD_INTO]: 'Add into',
    };
    return heading[action];
  };

  return {
    isEditable,
    parent,
    levels,
    sameLevel,
    subLevels,
    getAddDialogHeading,
    toggleOutlineItemExpand,
    expandOutlineItemParent,
  };
}
