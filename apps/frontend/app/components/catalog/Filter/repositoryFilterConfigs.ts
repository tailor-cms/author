import type { Tag } from '@tailor-cms/interfaces/repository';
import type { Schema } from '@tailor-cms/interfaces/schema';

export enum RepositoryFilterType {
  TAG = 'TAG',
  SCHEMA = 'SCHEMA',
}

export type RepositoryFilter =
  | (Tag & { type: RepositoryFilterType.TAG })
  | (Schema & { type: RepositoryFilterType.SCHEMA });

export default {
  [RepositoryFilterType.TAG]: {
    type: RepositoryFilterType.TAG,
    label: 'tags',
    queryParam: 'tagIds',
    icon: 'mdi-tag-outline',
  },
  [RepositoryFilterType.SCHEMA]: {
    type: RepositoryFilterType.SCHEMA,
    label: 'schemas',
    queryParam: 'schemas',
    icon: 'mdi-file-tree',
  },
} as const;
