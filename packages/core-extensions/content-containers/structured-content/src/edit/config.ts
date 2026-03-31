import { capitalize, reduce, words } from 'lodash-es';

// Container-level options that are not subcontainer type definitions:
// - isCollapsible: enable collapse/expand for subcontainers
// - collapsedPreviewKey: meta key shown in collapsed header
// - defaultSubcontainers: subcontainers to create on mount
const CONTAINER_OPTIONS = [
  'isCollapsible',
  'collapsedPreviewKey',
  'defaultSubcontainers',
];

const DefaultSubcontainerType = {
  Section: 'SECTION',
};

const DEFAULT_SUBCONTAINERS = {
  [DefaultSubcontainerType.Section]: {
    label: 'Section',
    icon: 'mdi-text-box-outline',
    layout: true,
    meta: [],
  },
};

const DEFAULT_RESULT = {
  subcontainers: DEFAULT_SUBCONTAINERS,
  defaultSubcontainers: [] as any[],
  isCollapsible: false,
};

export const parseConfig = (
  repository: any,
  outlineActivity: any,
  container: any,
  config: any,
) => {
  if (!config) return DEFAULT_RESULT;
  const {
    isCollapsible = false,
    collapsedPreviewKey = null,
    defaultSubcontainers = [],
  } = config;
  const subcontainers = reduce(
    config,
    (acc: Record<string, any>, val: any, key: string) => {
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
        collapsedPreviewKey:
          val.collapsedPreviewKey || collapsedPreviewKey,
      };
      return acc;
    },
    {},
  );
  return { subcontainers, defaultSubcontainers, isCollapsible };
};
