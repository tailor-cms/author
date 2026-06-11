export interface RepositoryFilterConfig {
  type: 'TAG' | 'SCHEMA';
  label: string;
  queryParam: 'tagIds' | 'schemas';
  icon: string;
}

const configs: Record<'TAG' | 'SCHEMA', RepositoryFilterConfig> = {
  TAG: {
    type: 'TAG',
    label: 'tags',
    queryParam: 'tagIds',
    icon: 'mdi-tag-outline',
  },
  SCHEMA: {
    type: 'SCHEMA',
    label: 'schemas',
    queryParam: 'schemas',
    icon: 'mdi-file-tree',
  },
};

export default configs;
