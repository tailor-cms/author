import { capitalize, reduce, words } from 'lodash-es';

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
  if (!config) return { subcontainers: DEFAULT_CONFIG, defaultSubcontainers: [], isCollapsible: false };
  // Container-level options (skipped by the sub-type reduce below):
  // - isCollapsible: enable collapse/expand for subcontainers
  // - collapsedPreviewKey: meta key to display in collapsed subcontainer header
  // - defaultSubcontainers: initial subcontainers to create on mount
  const CONTAINER_OPTIONS = ['isCollapsible', 'collapsedPreviewKey', 'defaultSubcontainers'];
  const {
    isCollapsible = false,
    collapsedPreviewKey = null,
    defaultSubcontainers = [],
  } = config;
  const subcontainers = reduce(
    config,
    (acc, val, key) => {
      if (CONTAINER_OPTIONS.includes(key)) return acc;
      acc[key] = {
        ...val,
        icon: val.icon || 'mdi-text',
        label: val.label || words(capitalize(key)),
        meta: val?.meta?.(repository, outlineActivity, container, val) ?? [],
        initMeta: () =>
          val?.initMeta?.(repository, outlineActivity, container, val) ?? {},
        contentElementConfig: val.contentElementConfig,
        disableContentElementList: !!val.disableContentElementList,
        disableAi: !!val.disableAi,
        isCollapsible: val.isCollapsible ?? isCollapsible,
        collapsedPreviewKey: val.collapsedPreviewKey || collapsedPreviewKey,
      };
      return acc;
    },
    {} as Record<string, any>,
  );
  return { subcontainers, defaultSubcontainers, isCollapsible };
};
