import type { Activity } from '@tailor-cms/interfaces/activity.ts';

export interface MetaField {
  key: string;
  label: string;
  // JSON Schema from meta-input manifest
  schema: { type: string; items?: { type: string } } | null;
  options?: { value: string | number; label: string }[];
}

export interface SubcontainerConfig {
  label: string;
  metaInputs: MetaField[];
  elementTypes: string[];
}

export type SubcontainerConfigs = Record<string, SubcontainerConfig>;

export interface ParsedConfig {
  subcontainers: SubcontainerConfigs;
  defaultSubcontainers: Pick<Activity, 'type' | 'data'>[];
  ai?: {
    definition?: string;
    outputRules?: { prompt?: string };
  };
}
