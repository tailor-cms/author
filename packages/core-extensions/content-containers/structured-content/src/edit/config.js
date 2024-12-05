import reduce from 'lodash/reduce';

const DefaultSubcontainers = {
  Section: 'SECTION',
};

const DEFAULT_CONFIG = {
  [DefaultSubcontainers.Section]: {
    label: 'Section',
    icon: 'mdi-text-box-outline',
    layout: true,
    meta: [],
    elementTypes: [],
    categories: [],
  },
};

export const parseConfig = (repository, outlineActivity, container, config) => {
  if (!config) return DEFAULT_CONFIG;
  return reduce(
    config,
    (acc, val, key) => {
      acc[key] = {
        ...val,
        meta: val?.meta(repository, outlineActivity, container, val),
      };
      return acc;
    },
    {},
  );
};
