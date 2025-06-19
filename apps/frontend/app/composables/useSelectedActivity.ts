import { get, uniqBy } from 'lodash-es';
import { computed } from 'vue';
import { InsertLocation } from '@tailor-cms/utils';

import type { StoreActivity } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

export const useSelectedActivity = (activity: StoreActivity | null) => {
  const { $schemaService } = useNuxtApp() as any;
  const repoStore = useCurrentRepository();
  const activityStore = useActivityStore();

  const isEditable = computed(() => {
    if (!activity) return false;
    return $schemaService.isEditable(activity.type);
  });

  const parent = computed(() => {
    if (!activity) return;
    const { parentId } = activity;
    return repoStore.outlineActivities.find((it) => it.id === parentId);
  });

  const sameLevel = computed(() => {
    if (!repoStore.taxonomy) return [];
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
    if (!repoStore.taxonomy || !activity) return [];
    const { type } = activity;
    const config = repoStore.taxonomy.find((it: any) => it.type === type);
    const configuredSubLevels = get(config, 'subLevels', []);
    return repoStore.taxonomy.filter((it: any) =>
      configuredSubLevels.includes(it.type),
    );
  });

  const levels = computed(() => {
    return uniqBy(sameLevel.value.concat(subLevels.value), 'type');
  });

  const isOutlineItemExpanded = (id: string | number) =>
    repoStore.isOutlineItemExpanded(id);

  const toggleOutlineItemExpand = (uid: string, expand?: boolean) =>
    repoStore.toggleOutlineItemExpand(uid, expand);

  const expandOutlineItemParent = (item: any) => {
    const uid = activityStore.getParent(item.uid)?.uid;
    if (uid) repoStore.toggleOutlineItemExpand(uid, true);
  };

  const getAddDialogHeading = (action: InsertLocation) => {
    const heading: Record<string, string> = {
      [InsertLocation.AddBefore]: 'Add above',
      [InsertLocation.AddAfter]: 'Add below',
      [InsertLocation.AddInto]: 'Add into',
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
    isOutlineItemExpanded,
    toggleOutlineItemExpand,
    expandOutlineItemParent,
  };
};
