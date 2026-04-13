export interface TopicItem {
  id: number;
  name: string;
  parentName?: string;
  // Full ancestor breadcrumb (e.g. "Module 1 / Sub-module")
  breadcrumb: string;
  isGroup: boolean;
  isLeaf: boolean;
  depth: number;
  // Full context path for building search queries.
  context: string[];
}
