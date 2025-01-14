import capitalize from 'lodash/capitalize';
import reduce from 'lodash/reduce';
import words from 'lodash/words';

const DefaultSubcontainers = {
  Section: 'SECTION',
};

const DEFAULT_CONFIG = {
  [DefaultSubcontainers.Section]: {
    label: 'Section',
    icon: 'mdi-text-box-outline',
    layout: true,
    meta: [],
  },
};

export const parseConfig = (repository, outlineActivity, container, config) => {
  if (!config) return DEFAULT_CONFIG;
  return reduce(
    config,
    (acc, val, key) => {
      acc[key] = {
        ...val,
        icon: val.icon || 'mdi-text',
        label: val.label || words(capitalize(key)),
        meta: val?.meta(repository, outlineActivity, container, val),
        initMeta: () =>
          val?.initMeta(repository, outlineActivity, container, val) || {},
      };
      return acc;
    },
    {},
  );
};
