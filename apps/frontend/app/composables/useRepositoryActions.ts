import type { RepositoryAccessContext } from '@tailor-cms/utils';

import {
  canCloneRepository,
  canDeleteRepository,
  canExportRepository,
  canPublishRepository,
} from '@tailor-cms/utils';

export interface RepositoryAction {
  name: 'clone' | 'publish' | 'export' | 'delete';
  label: string;
  icon: string;
  color?: string;
}

type ActionName = RepositoryAction['name'];
type ActionPolicy = (access: RepositoryAccessContext) => boolean;

const ACTIONS: RepositoryAction[] = [
  { name: 'clone', label: 'Clone', icon: 'content-copy' },
  { name: 'publish', label: 'Publish', icon: 'cloud-upload-outline' },
  { name: 'export', label: 'Export', icon: 'archive-arrow-down-outline' },
  {
    name: 'delete',
    label: 'Delete',
    icon: 'trash-can-outline',
    color: 'error',
  },
];

const ACTION_POLICIES: Record<ActionName, ActionPolicy> = {
  clone: canCloneRepository,
  publish: canPublishRepository,
  export: canExportRepository,
  delete: canDeleteRepository,
};

/**
 * Resolves the repository actions (catalog card + navigation rail menu)
 * the given access-policy context allows the acting user to run.
 */
export const useRepositoryActions = (
  accessPolicy: MaybeRefOrGetter<RepositoryAccessContext | null | undefined>,
) =>
  computed<RepositoryAction[]>(() => {
    const policy = toValue(accessPolicy);
    if (!policy) return [];
    return ACTIONS.filter((it) => ACTION_POLICIES[it.name](policy));
  });
